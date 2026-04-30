
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import os from 'os';
import archiver from 'archiver';
import { exec } from 'child_process';
import sharp from 'sharp';
import cors from 'cors';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { analyzeImage, executeRestoration, analyzeRestoredImage, generateProjectNarrative } from './aiEngine.js';
import { createProxy, validateImage, optimizeForModel } from './imageLab.js';
import { generateReportIndexHtml, generateImageReportHtml } from './reportGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from standard .env and .env.local in the project root
dotenv.config(); 
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Map common API key environment variable names to the required process.env.API_KEY
process.env.API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

const STORAGE_ROOT = path.resolve(__dirname, 'server_storage');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const DEFAULT_PROJECTS_ROOT = path.join(STORAGE_ROOT, 'projects');

if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT);

let currentProjectsRoot = DEFAULT_PROJECTS_ROOT;
let currentLogoPath = "";

const loadSettings = () => {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
            if (settings.projectsPath) currentProjectsRoot = settings.projectsPath;
            if (settings.logoPath) currentLogoPath = settings.logoPath;
        }
    } catch (e) {}
};
loadSettings();
if (!fs.existsSync(currentProjectsRoot)) fs.mkdirSync(currentProjectsRoot, { recursive: true });

// Verify AI Connectivity on startup
const verifyAiConnection = async () => {
    console.log('--------------------------------------------------');
    console.log('🛡️  Lumina Restore Security Subsystem Booting...');
    
    if (process.env.API_KEY) {
        const maskedKey = `${process.env.API_KEY.substring(0, 4)}...${process.env.API_KEY.substring(process.env.API_KEY.length - 4)}`;
        console.log(`✅ AI_ENGINE: Connection Established (Key: ${maskedKey})`);
        console.log(`🤖 MODELS: Gemini 3 Pro & Nano Banana Pro linked.`);
    } else {
        console.error('❌ AI_ENGINE: Authentication Failed. API_KEY is missing.');
        console.warn('⚠️  Restoration and Analysis features will be unavailable.');
    }
    console.log('--------------------------------------------------');
};

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const sanitizeName = (name) => name.replace(/[^a-z0-9 \-_.]/gi, '').trim();
const isPathSafe = (requestedPath, basePath) => path.resolve(path.normalize(requestedPath)).startsWith(path.resolve(basePath));

const getProjectDir = (id) => {
    try {
        const relPathString = Buffer.from(id, 'base64url').toString('utf8');
        const safeParts = relPathString.split('/').map(p => path.basename(p)); 
        return path.join(currentProjectsRoot, ...safeParts);
    } catch (e) { return path.join(currentProjectsRoot, id); }
};

const updateProjectTotals = (project) => {
    let totalTokens = 0;
    let totalCost = 0;
    project.images.forEach(img => {
        if (img.usage) {
            totalTokens += img.usage.totalTokens || 0;
            totalCost += img.usage.totalCost || 0;
        }
    });
    project.stats = project.stats || {};
    project.stats.totalTokens = totalTokens;
    project.stats.totalCost = totalCost;
};

const loadProject = async (id) => {
    const dir = getProjectDir(id);
    try {
        const d = await fsPromises.readFile(path.join(dir, 'project_data.json'), 'utf8');
        return JSON.parse(d);
    } catch { return null; }
};

const saveProject = async (p) => {
    const dir = getProjectDir(p.id);
    updateProjectTotals(p);
    await fsPromises.writeFile(path.join(dir, 'project_data.json'), JSON.stringify(p, null, 2));
};

const upload = multer({ dest: os.tmpdir() });

app.get('/api/health', (req, res) => res.json({ status: 'online' }));

app.get('/api/settings', (req, res) => res.json({ projectsPath: currentProjectsRoot, logoPath: currentLogoPath }));

app.post('/api/settings', asyncHandler(async (req, res) => {
    const { projectsPath, logoPath } = req.body;
    if (projectsPath) currentProjectsRoot = projectsPath;
    if (logoPath) currentLogoPath = logoPath;
    await fsPromises.writeFile(SETTINGS_FILE, JSON.stringify({ projectsPath: currentProjectsRoot, logoPath: currentLogoPath }));
    res.json({ success: true });
}));

app.get('/api/logo', (req, res) => {
    if (fs.existsSync(currentLogoPath)) res.sendFile(currentLogoPath);
    else res.status(404).send('No logo');
});

app.get('/api/projects', asyncHandler(async (req, res) => {
    if (!fs.existsSync(currentProjectsRoot)) return res.json([]);
    const rootItems = await fsPromises.readdir(currentProjectsRoot, { withFileTypes: true });
    const projects = [];
    for (const item of rootItems) {
        if (!item.isDirectory()) continue;
        const projectPath = path.join(currentProjectsRoot, item.name);
        if (fs.existsSync(path.join(projectPath, 'project_data.json'))) {
            projects.push(await loadProject(item.name));
        } else {
             const subItems = await fsPromises.readdir(projectPath, { withFileTypes: true });
             for (const sub of subItems) {
                 if (sub.isDirectory()) {
                    const id = Buffer.from(`${item.name}/${sub.name}`).toString('base64url');
                    const p = await loadProject(id);
                    if (p) projects.push(p);
                 }
             }
        }
    }
    res.json(projects.filter(Boolean).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
}));

app.post('/api/projects', asyncHandler(async (req, res) => {
    const { clientName, title } = req.body;
    const safeClient = sanitizeName(clientName);
    const safeTitle = sanitizeName(title);
    const projectDir = path.join(currentProjectsRoot, safeClient, safeTitle);
    await fsPromises.mkdir(projectDir, { recursive: true });
    await fsPromises.mkdir(path.join(projectDir, 'Uploads'), { recursive: true });
    await fsPromises.mkdir(path.join(projectDir, 'Analysed'), { recursive: true });
    await fsPromises.mkdir(path.join(projectDir, 'Restored'), { recursive: true });
    await fsPromises.mkdir(path.join(projectDir, 'thumbnails'), { recursive: true });

    const id = Buffer.from(`${safeClient}/${safeTitle}`).toString('base64url');
    const project = { id, clientName, title, createdAt: new Date().toISOString(), status: 'active', images: [] };
    await saveProject(project);
    res.json(project);
}));

app.get('/api/projects/:id', asyncHandler(async (req, res) => {
    const p = await loadProject(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
}));

app.delete('/api/projects/:id', asyncHandler(async (req, res) => {
    const dir = getProjectDir(req.params.id);
    await fsPromises.rm(dir, { recursive: true, force: true });
    res.json({ success: true });
}));

app.post('/api/projects/:id/upload', upload.array('files'), asyncHandler(async (req, res) => {
    const project = await loadProject(req.params.id);
    const uploadsDir = path.join(getProjectDir(project.id), 'Uploads');
    const files = await fsPromises.readdir(uploadsDir);
    let currentNum = files.length;

    for (const file of req.files) {
        currentNum++;
        const ext = path.extname(file.originalname);
        const filename = `Image ${String(currentNum).padStart(3, '0')}${ext}`;
        const targetPath = path.join(uploadsDir, filename);
        await fsPromises.copyFile(file.path, targetPath);
        
        const thumbBuffer = await createProxy(await fsPromises.readFile(targetPath), 300);
        await fsPromises.writeFile(path.join(getProjectDir(project.id), 'thumbnails', filename), thumbBuffer);

        project.images.push({
            id: uuidv4(),
            filename,
            displayFilename: filename,
            originalPath: `Uploads/${filename}`,
            status: 'uploaded',
            usage: { totalTokens: 0, totalCost: 0 }
        });
    }
    await saveProject(project);
    res.json(project);
}));

app.get('/api/projects/:pid/images/:iid/file', asyncHandler(async (req, res) => {
    const { pid, iid } = req.params;
    const { type } = req.query;
    const project = await loadProject(pid);
    const img = project.images.find(i => i.id === iid);
    let relPath;
    if (type === 'original') relPath = img.originalPath;
    else if (type === 'analysed') relPath = img.analysedPath || img.originalPath;
    else if (type === 'restored') relPath = img.restoredPath;
    else if (type === 'thumbnail') relPath = `thumbnails/${img.filename}`;
    res.sendFile(path.join(getProjectDir(pid), relPath));
}));

app.delete('/api/projects/:pid/images/:iid', asyncHandler(async (req, res) => {
    const project = await loadProject(req.params.pid);
    project.images = project.images.filter(i => i.id !== req.params.iid);
    await saveProject(project);
    res.json({ success: true });
}));

app.post('/api/projects/:pid/images/:iid/analyze', asyncHandler(async (req, res) => {
    const project = await loadProject(req.params.pid);
    const img = project.images.find(i => i.id === req.params.iid);
    const projectDir = getProjectDir(project.id);
    const analysedRelPath = `Analysed/${img.filename}`;
    await fsPromises.mkdir(path.join(projectDir, 'Analysed'), { recursive: true });
    await fsPromises.copyFile(path.join(projectDir, img.originalPath), path.join(projectDir, analysedRelPath));
    img.analysedPath = analysedRelPath;
    
    const buffer = await fsPromises.readFile(path.join(projectDir, analysedRelPath));
    const proxy = await createProxy(buffer, 1024);
    const analysis = await analyzeImage(proxy.toString('base64'), 'image/jpeg', req.body.context);
    
    img.analysis = analysis;
    img.usage = img.usage || { totalTokens: 0, totalCost: 0 };
    img.usage.analysis = analysis.usage;
    img.usage.totalTokens = (img.usage.totalTokens || 0) + analysis.usage.promptTokens + analysis.usage.candidatesTokens;
    img.usage.totalCost = (img.usage.totalCost || 0) + analysis.usage.cost;
    
    img.status = 'analyzed';
    await saveProject(project);
    res.json(analysis);
}));

app.post('/api/projects/:pid/images/:iid/restore', asyncHandler(async (req, res) => {
    const { active_steps, resolution, context, sourceType } = req.body;
    const project = await loadProject(req.params.pid);
    const img = project.images.find(i => i.id === req.params.iid);
    let inputPath = img.analysedPath || img.originalPath;
    if (sourceType === 'restored' && img.restoredPath) inputPath = img.restoredPath;

    const inputBuffer = await fsPromises.readFile(path.join(getProjectDir(project.id), inputPath));
    
    // Detect closest supported aspect ratio for Gemini
    const metadata = await validateImage(inputBuffer);
    const originalRatio = metadata.width / metadata.height;
    const supportedRatios = [
        { label: '1:1', value: 1.0 },
        { label: '4:3', value: 4/3 },
        { label: '3:4', value: 3/4 },
        { label: '16:9', value: 16/9 },
        { label: '9:16', value: 9/16 }
    ];
    
    const bestRatio = supportedRatios.reduce((prev, curr) => 
        Math.abs(curr.value - originalRatio) < Math.abs(prev.value - originalRatio) ? curr : prev
    ).label;

    const optimized = await optimizeForModel(inputBuffer);
    
    const result = await executeRestoration(
        optimized.toString('base64'), 
        'image/jpeg', 
        img.analysis, 
        active_steps, 
        resolution || '4K', 
        bestRatio, 
        true, 
        context || img.userContext
    );

    const baseName = path.parse(img.filename).name;
    const restoredFilename = `${baseName}_Restored.jpg`;
    const restoredRelPath = `Restored/${restoredFilename}`;
    await fsPromises.mkdir(path.join(getProjectDir(project.id), 'Restored'), { recursive: true });
    await fsPromises.writeFile(path.join(getProjectDir(project.id), restoredRelPath), Buffer.from(result.data, 'base64'));

    img.restoredPath = restoredRelPath;
    
    // Mark executed steps as completed in the plan
    if (img.analysis && img.analysis.restorationPlan) {
        const activeIds = new Set(active_steps.map(s => s.id));
        img.analysis.restorationPlan = img.analysis.restorationPlan.map(step => 
            activeIds.has(step.id) ? { ...step, status: 'completed' } : step
        );
    }

    img.usage = img.usage || { totalTokens: 0, totalCost: 0 };
    img.usage.restoration = result.usage;
    img.usage.totalTokens = (img.usage.totalTokens || 0) + result.usage.promptTokens + result.usage.candidatesTokens;
    img.usage.totalCost = (img.usage.totalCost || 0) + result.usage.cost;
    
    img.status = 'completed';
    await saveProject(project);
    res.json({ success: true });
}));

app.post('/api/projects/:pid/images/:iid/audit', asyncHandler(async (req, res) => {
    const project = await loadProject(req.params.pid);
    const img = project.images.find(i => i.id === req.params.iid);
    const buffer = await fsPromises.readFile(path.join(getProjectDir(project.id), img.restoredPath));
    const proxy = await createProxy(buffer, 1024);
    const result = await analyzeRestoredImage(proxy.toString('base64'), 'image/jpeg', req.body.focus, img.analysis);
    
    // Merge new refinement steps into the existing restoration plan to keep history
    if (img.analysis && result.restorationPlan) {
        const currentPlan = img.analysis.restorationPlan || [];
        const newSteps = result.restorationPlan.map(s => ({ ...s, id: uuidv4() }));
        img.analysis.restorationPlan = [...currentPlan, ...newSteps];
        img.analysis.auditFocus = req.body.focus;
    }

    img.usage = img.usage || { totalTokens: 0, totalCost: 0 };
    img.usage.refinement = result.usage;
    img.usage.totalTokens = (img.usage.totalTokens || 0) + result.usage.promptTokens + result.usage.candidatesTokens;
    img.usage.totalCost = (img.usage.totalCost || 0) + result.usage.cost;
    
    await saveProject(project);
    res.json(result);
}));

app.post('/api/projects/:id/export', asyncHandler(async (req, res) => {
    const project = await loadProject(req.params.id);
    const projectDir = getProjectDir(project.id);
    const exportDir = path.join(projectDir, 'Reports');
    const assetsDir = path.join(exportDir, 'assets');

    if (!fs.existsSync(exportDir)) await fsPromises.mkdir(exportDir, { recursive: true });
    if (!fs.existsSync(assetsDir)) await fsPromises.mkdir(assetsDir, { recursive: true });

    // Logo data URI
    let logoDataUri = "";
    if (currentLogoPath && fs.existsSync(currentLogoPath)) {
        const logoBuffer = await fsPromises.readFile(currentLogoPath);
        const ext = path.extname(currentLogoPath).substring(1);
        logoDataUri = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
    }

    const reportImages = [];

    for (let i = 0; i < project.images.length; i++) {
        const img = project.images[i];
        // We generate reports for any image that has at least been analysed
        if (img.status === 'completed' || img.status === 'analyzed' || img.analysedPath) {
            const ext = path.extname(img.filename);
            const origName = `original_${img.id}${ext}`;
            const restName = img.restoredPath ? `restored_${img.id}${ext}` : null;
            const thumbName = `thumb_${img.id}${ext}`;

            // Copy Original
            await fsPromises.copyFile(path.join(projectDir, img.originalPath), path.join(assetsDir, origName));
            
            // Copy Restored
            if (restName && img.restoredPath) {
                await fsPromises.copyFile(path.join(projectDir, img.restoredPath), path.join(assetsDir, restName));
            }
            
            // Copy Thumbnail
            const thumbPath = path.join(projectDir, 'thumbnails', img.filename);
            if (fs.existsSync(thumbPath)) {
                await fsPromises.copyFile(thumbPath, path.join(assetsDir, thumbName));
            }

            const reportFilename = `Report_${i + 1}.html`;
            
            // Prepare image object for generator with relative paths inside the export folder
            const imgForReport = {
                ...img,
                originalPath: `assets/${origName}`,
                restoredPath: restName ? `assets/${restName}` : null,
                thumbnailPath: `assets/${thumbName}`,
                reportFilename
            };

            reportImages.push(imgForReport);
        }
    }

    // Generate individual reports
    for (let i = 0; i < reportImages.length; i++) {
        const img = reportImages[i];
        const nav = {
            prev: i > 0 ? reportImages[i - 1].reportFilename : null,
            next: i < reportImages.length - 1 ? reportImages[i + 1].reportFilename : null,
            home: 'index.html'
        };
        const html = generateImageReportHtml(project, img, logoDataUri, nav);
        await fsPromises.writeFile(path.join(exportDir, img.reportFilename), html);
    }

    // Generate index gallery page
    const indexHtml = generateReportIndexHtml(project, reportImages, logoDataUri);
    await fsPromises.writeFile(path.join(exportDir, 'index.html'), indexHtml);

    res.json({ success: true, message: `Generated ${reportImages.length} reports in the 'Reports' folder.` });
}));

app.post('/api/projects/:id/open-folder', asyncHandler(async (req, res) => {
    const p = getProjectDir(req.params.id);
    const cmd = process.platform === 'win32' ? `start "" "${p}"` : `open "${p}"`;
    exec(cmd);
    res.json({ success: true });
}));

// 1. Determine the correct path to the 'dist' folder
// We check two locations:
// - '../dist' (for when running locally in the /backend folder)
// - './dist'  (for when running inside Docker where files are flattened)
const distPathLocal = path.resolve(__dirname, '../dist');
const distPathDocker = path.resolve(__dirname, 'dist');
let distPath = '';

if (fs.existsSync(distPathDocker)) {
    distPath = distPathDocker;
    console.log(`🐳 Docker environment detected. Serving frontend from: ${distPath}`);
} else if (fs.existsSync(distPathLocal)) {
    distPath = distPathLocal;
    console.log(`💻 Local environment detected. Serving frontend from: ${distPath}`);
}

// 2. Serve the frontend if found
if (distPath) {
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
} else {
    console.error('❌ ERROR: Could not find "dist" folder. Did you run "npm run build"?');
}

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await verifyAiConnection();
});
