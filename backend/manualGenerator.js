

import PDFDocument from 'pdfkit';

export const streamManual = (res) => {
    const doc = new PDFDocument({ bufferPages: true, margin: 50, size: 'A4' });

    doc.pipe(res);

    // Design Tokens
    const colors = {
        brand: '#2563eb', // blue-600
        dark: '#0f172a',  // slate-900
        text: '#334155',  // slate-700
        light: '#94a3b8'  // slate-400
    };

    // --- TITLE PAGE ---
    doc.rect(0, 0, doc.page.width, 150).fill(colors.dark);
    
    // Logo Placeholder
    doc.circle(doc.page.width / 2, 75, 30).fill(colors.brand);
    doc.fontSize(24).fillColor('white').font('Helvetica-Bold').text('L', doc.page.width / 2 - 8, 65);

    doc.moveDown(5);
    doc.fontSize(32).fillColor(colors.brand).font('Helvetica-Bold').text('Lumina Restore', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(colors.dark).font('Helvetica').text('Professional Forensic Photograph Restoration', { align: 'center' });
    
    doc.moveDown(2);
    doc.fontSize(10).fillColor(colors.text).text('USER MANUAL & DOCUMENTATION', { align: 'center', letterSpacing: 2 });
    doc.text('Version 1.0.0', { align: 'center' });

    doc.moveDown(4);
    doc.fontSize(10).fillColor(colors.light).text('Powered by Gemini 3 Pro & Nano Banana Pro', { align: 'center' });

    doc.addPage();

    // --- SECTIONS ---

    // 1. Introduction
    addSectionHeader(doc, '1. Introduction', colors);
    addBodyText(doc, 'Lumina Restore is a professional-grade agentic photograph restoration platform designed for forensic conservators and archivists. Unlike standard filters, Lumina Restore employs a multi-agent system using Google\'s Gemini 3 models to perform "Material Archaeology" before any pixel is altered.', colors);
    
    doc.moveDown();
    addBodyText(doc, 'The system operates on three core pillars:', colors);
    addBullet(doc, 'Forensic Diagnosis: Identifying substrate, era, and pathology (Gemini 3 Pro).', colors);
    addBullet(doc, 'Ethical Restoration: Prioritizing stabilization over beautification (Nano Banana Pro).', colors);
    addBullet(doc, 'Audit & Refinement: A dedicated "Reflection Agent" ensures quality control.', colors);

    doc.moveDown(2);

    // 2. The Agentic Workflow
    addSectionHeader(doc, '2. The Agentic Workflow', colors);
    addBodyText(doc, 'Lumina Restore follows a strict linear workflow to ensure data integrity and auditability:', colors);
    
    doc.moveDown();
    drawStep(doc, '1. Ingestion', 'Upload high-resolution scans. The system creates a secure project container.', colors);
    drawStep(doc, '2. Analysis', 'Gemini 3 Pro scans the image to identify physical defects (tears, foxing) and chemical decay.', colors);
    drawStep(doc, '3. Strategy', 'Review the generated "Restoration Plan". You can toggle specific interventions.', colors);
    drawStep(doc, '4. Execution', 'Nano Banana Pro executes the plan. Enable "Thinking Mode" for complex reconstruction.', colors);
    drawStep(doc, '5. Audit', 'The "Reflection Agent" audits the result for artifacts or hallucinations.', colors);

    doc.addPage();

    // 3. Key Features
    addSectionHeader(doc, '3. Key Features', colors);
    
    addSubHeader(doc, 'Material Archaeology', colors);
    addBodyText(doc, 'The system identifies historical formats (e.g., Daguerreotype, Tintype) and common defects. This diagnosis informs the specific restoration strategy, ensuring textures are preserved correctly.', colors);

    doc.moveDown();
    addSubHeader(doc, 'Thinking Mode', colors);
    addBodyText(doc, 'For complex damage, enabling "Thinking Mode" allows the model to reason through light transport physics and geometry before generating pixels. This consumes more tokens but results in higher fidelity reconstruction for missing data.', colors);

    doc.moveDown();
    addSubHeader(doc, 'The Trust Pyramid', colors);
    addBodyText(doc, 'Lumina Restore prioritizes transparency. The "Trust Pyramid" visualizes the distance from the original truth. "Conservation" actions are High Trust, while "Reconstruction" actions are Lower Trust.', colors);

    doc.moveDown(2);

    // 4. Interface Guide
    addSectionHeader(doc, '4. Interface Guide', colors);
    addBullet(doc, 'Dashboard: View active projects and progress summaries.', colors);
    addBullet(doc, 'Film Strip: Navigate project images via the left sidebar.', colors);
    addBullet(doc, 'Restoration Canvas: Use Pan/Zoom controls to inspect details. Toggle "Compare" mode to view the restoration overlay.', colors);
    addBullet(doc, 'Inspector Panel: The right sidebar contains the diagnostic report and control triggers.', colors);

    doc.moveDown(2);

    // 5. Troubleshooting
    addSectionHeader(doc, '5. Troubleshooting', colors);
    addBullet(doc, '503 Errors: If the AI model is overloaded, the system uses exponential backoff. Please wait.', colors);
    addBullet(doc, 'Upload Failures: Ensure images are valid JPG/PNG formats under 20MB.', colors);
    addBullet(doc, 'Artifacts: If faces look "waxy", try running the "Fix Defects" audit in the completion view.', colors);

    // Footer Pagination
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        // Don't print footer on cover
        if (i > 0) {
            doc.fontSize(8).fillColor(colors.light).text(
                `Lumina Restore - User Manual - Page ${i + 1} of ${range.count}`,
                50,
                doc.page.height - 40,
                { align: 'center' }
            );
        }
    }

    doc.end();
};

function addSectionHeader(doc, text, colors) {
    doc.fontSize(16).fillColor(colors.dark).font('Helvetica-Bold').text(text);
    doc.moveDown(0.25);
    doc.rect(50, doc.y, 495, 2).fill(colors.light);
    doc.moveDown(0.75);
}

function addSubHeader(doc, text, colors) {
    doc.fontSize(12).fillColor(colors.dark).font('Helvetica-Bold').text(text);
    doc.moveDown(0.25);
}

function addBodyText(doc, text, colors) {
    doc.fontSize(10).fillColor(colors.text).font('Helvetica').text(text, { align: 'justify', lineGap: 2 });
}

function addBullet(doc, text, colors) {
    doc.rect(50, doc.y + 4, 3, 3).fill(colors.brand);
    doc.fontSize(10).fillColor(colors.text).text(text, 65, doc.y, { align: 'left', lineGap: 4 });
}

function drawStep(doc, title, desc, colors) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor(colors.brand).text(title, { continued: true });
    doc.font('Helvetica').fillColor(colors.text).text(`: ${desc}`);
    doc.moveDown(0.5);
}