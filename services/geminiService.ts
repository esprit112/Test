
import { DamageAnalysis, Project, RestorationStep, APIError } from "../types";
import { timeout } from "../utils/helpers";

// --- CONFIGURATION ---
const DEFAULT_TIMEOUT = 30000; // 30s for standard requests
const AI_TIMEOUT = 300000; // 5 minutes for AI operations (Restoration/Analysis)

// --- HELPERS ---

/**
 * Enhanced fetch with timeout, error handling, and type safety
 */
async function fetchWithTimeout<T>(
    url: string, 
    options: RequestInit = {}, 
    timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}`;
            let errorCode = 'UNKNOWN_ERROR';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                errorCode = errorData.code || 'API_ERROR';
            } catch (e) {
                // Ignore JSON parse error on failure
            }
            
            throw new APIError(errorMessage, response.status, errorCode);
        }

        // Handle void/empty responses
        if (response.status === 204) {
            return {} as T;
        }

        return await response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new APIError('Request timed out', 408, 'TIMEOUT');
        }
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(error.message || "Network request failed", 500, 'NETWORK_ERROR');
    } finally {
        clearTimeout(id);
    }
}

/**
 * Retry Logic Helper with Exponential Backoff
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            // Don't retry client errors (4xx) except 408/429
            if (e instanceof APIError && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429) {
                throw e;
            }
            
            if (i === maxRetries - 1) throw e;
            
            const delayTime = Math.pow(2, i) * baseDelay;
            console.log(`API Error (Attempt ${i + 1}/${maxRetries}). Retrying in ${delayTime}ms...`, e.message);
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }
    }
    throw new APIError("Max retries exceeded", 500, 'MAX_RETRIES');
}

// --- API METHODS ---

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await fetchWithTimeout('/api/health', {}, 5000);
    return true;
  } catch (e) {
    return false;
  }
};

export const getSettings = async (): Promise<{projectsPath: string, logoPath: string}> => {
    return withRetry(() => fetchWithTimeout('/api/settings'));
};

export const saveSettings = async (projectsPath: string, logoPath: string): Promise<void> => {
    return withRetry(() => fetchWithTimeout('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectsPath, logoPath })
    }));
};

export const getProjects = async (): Promise<Project[]> => {
    return withRetry(() => fetchWithTimeout('/api/projects'));
};

export const createProject = async (clientName: string, title: string): Promise<Project> => {
    return withRetry(() => fetchWithTimeout('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, title })
    }));
};

export const deleteProject = async (id: string): Promise<void> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${id}`, { method: 'DELETE' }));
};

export const getProjectDetails = async (id: string): Promise<Project> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${id}`));
};

export const deleteProjectImage = async (projectId: string, imageId: string): Promise<void> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/images/${imageId}`, { method: 'DELETE' }));
};

export const uploadImages = async (projectId: string, files: File[]): Promise<Project> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    
    // No retry on upload to avoid duplicate data
    return fetchWithTimeout(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData
    }, 60000); // 60s timeout for upload
};

export const getImageUrls = (projectId: string, imageId: string): { originalUrl: string, analysedUrl: string, restoredUrl: string } => {
    const ts = new Date().getTime();
    return {
        originalUrl: `/api/projects/${projectId}/images/${imageId}/file?type=original&t=${ts}`,
        analysedUrl: `/api/projects/${projectId}/images/${imageId}/file?type=analysed&t=${ts}`,
        restoredUrl: `/api/projects/${projectId}/images/${imageId}/file?type=restored&t=${ts}`
    };
};

export const analyzeProjectImage = async (projectId: string, imageId: string, userContext?: string): Promise<DamageAnalysis> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/images/${imageId}/analyze`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: userContext })
    }, AI_TIMEOUT)); // Extended timeout
};

export const restoreProjectImage = async (
    projectId: string, 
    imageId: string, 
    steps: RestorationStep[], 
    thinkingMode: boolean = false,
    resolution: '1K' | '2K' | '4K' = '4K', // Professional high-fidelity default
    userContext?: string,
    sourceType: 'analysed' | 'restored' = 'analysed'
): Promise<void> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/images/${imageId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            active_steps: steps, 
            thinking_mode: thinkingMode, 
            resolution, 
            context: userContext,
            sourceType 
        })
    }, AI_TIMEOUT), 2); // Less retries for heavy ops
};

export const auditProjectImage = async (projectId: string, imageId: string, focus: string = 'general'): Promise<DamageAnalysis> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/images/${imageId}/audit`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus }) 
    }, AI_TIMEOUT));
};

export const commitProjectImage = async (projectId: string, imageId: string): Promise<void> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/images/${imageId}/commit`, { method: 'POST' }));
};

export const generateProjectSummary = async (projectId: string): Promise<Project> => {
    return withRetry(() => fetchWithTimeout(`/api/projects/${projectId}/summary`, { method: 'POST' }, 60000));
};

export const exportProject = async (projectId: string): Promise<{success: boolean, message: string}> => {
    return fetchWithTimeout(`/api/projects/${projectId}/export`, { method: 'POST' }, 120000);
};

export const openProjectFolder = async (projectId: string): Promise<void> => {
    return fetchWithTimeout(`/api/projects/${projectId}/open-folder`, { method: 'POST' });
};
