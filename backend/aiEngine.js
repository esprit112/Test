import { GoogleGenAI } from "@google/genai";

// --- PRICING CONFIGURATION ---
const RATES = {
    'gemini-3.1-pro-preview': { input: 2.00 / 1000000, output: 12.00 / 1000000 },
    'gemini-3.1-flash-image-preview': { input: 2.00 / 1000000, output: 60.00 / 1000000 },
    'gemini-3-flash-preview': { input: 0.50 / 1000000, output: 3.00 / 1000000 },
};

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in process.env.API_KEY.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const calculateCost = (model, usage) => {
    const rate = RATES[model] || RATES['gemini-3-flash-preview'];
    const inputCost = (usage?.promptTokenCount || 0) * rate.input;
    const outputCost = (usage?.candidatesTokenCount || 0) * rate.output;
    return {
        promptTokens: usage?.promptTokenCount || 0,
        candidatesTokens: usage?.candidatesTokenCount || 0,
        cost: inputCost + outputCost
    };
};

const SYSTEM_INSTRUCTION_DIAGNOSIS = `
You are a professional forensic photograph conservator. 
Analyze the material archaeology and diagnose pathologies.
Research historical context via Google Search for authentic colors.
Return ONLY valid JSON.
`;

const SYSTEM_INSTRUCTION_RESTORATION = `
You are a Forensic Digital Conservator. 
Your mandate is DOCUMENTARY TRUTH. Preserve grain and identity.
No hallucinations. 4K High Fidelity output.
`;

function cleanJson(text) {
    if (!text) return null;
    try {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
    }
}

export async function analyzeImage(base64Image, mimeType, userContext) {
    const ai = getClient();
    const modelName = 'gemini-3.1-pro-preview';
    
    const prompt = `
    Perform a "Forensic Analysis" of this asset.
    CONTEXT: "${userContext || "None provided"}"
    Research via Google Search for accuracy.
    Map defects with [ymin, xmin, ymax, xmax] boxes (0-1000).

    JSON SCHEMA:
    {
      "materialSubstrate": "string",
      "historicalEra": "string",
      "conditionRating": 1-10,
      "visualResearch": "string",
      "geolocation": "string",
      "subjects": [{ "count": number, "gender": "string", "ageGroup": "string" }],
      "detectedObjects": [{ "object": "string", "category": "string", "location": "string" }],
      "defects": [{ "type": "string", "severity": "high|medium|low", "box_2d": [number] }],
      "restorationPlan": [{ "id": "uuid", "type": "digital|chemical|physical", "description": "string", "tool": "string", "status": "pending" }]
    }
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        },
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: SYSTEM_INSTRUCTION_DIAGNOSIS,
            responseMimeType: "application/json"
        }
    });

    const data = cleanJson(response.text) || { restorationPlan: [] };
    let groundingLinks = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
         response.candidates[0].groundingMetadata.groundingChunks.forEach(c => {
             if (c.web) groundingLinks.push({ uri: c.web.uri, title: c.web.title || "Source" });
         });
    }

    const usage = calculateCost(modelName, response.usageMetadata);
    return { ...data, groundingLinks, usage };
}

export async function executeRestoration(base64Image, mimeType, analysis, activeSteps, size, aspectRatio, thinkingMode, userContext) {
    const ai = getClient();
    const modelName = 'gemini-3.1-flash-image-preview'; 

    const plan = activeSteps?.map((s, i) => `${i + 1}. [${s.tool}] ${s.description}`).join("\n");

    const prompt = `
    EXECUTE RESTORATION PIPELINE (4K).
    SUBSTRATE: ${analysis?.materialSubstrate}
    PLAN:
    ${plan || "Full heuristic restoration."}
    CONTEXT: ${userContext}
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ inlineData: { mimeType, data: base64Image } }, { text: prompt }] },
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_RESTORATION,
            imageConfig: { imageSize: size || '4K', aspectRatio: aspectRatio || "1:1" }
        }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) throw new Error("Restoration output failed to generate image data.");
    
    const usage = calculateCost(modelName, response.usageMetadata);
    return { data: part.inlineData.data, usage };
}

export async function analyzeRestoredImage(base64Image, mimeType, focusMode, currentAnalysis) {
    const ai = getClient();
    const modelName = 'gemini-3.1-pro-preview';
    
    const prompt = `
    Audit this restored asset for artifacts or hallucinations. 
    FOCUS: ${focusMode.toUpperCase()}
    Return JSON: { "restorationPlan": [{ "id": "uuid", "description": "string", "tool": "Refinement", "status": "pending" }] }
    `;
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: {
            parts: [
                { inlineData: { mimeType, data: base64Image } },
                { text: prompt }
            ]
        },
        config: { 
            responseMimeType: "application/json",
            systemInstruction: "You are a critical forensic auditor."
        }
    });

    const data = cleanJson(response.text) || { restorationPlan: [] };
    const usage = calculateCost(modelName, response.usageMetadata);
    return { ...data, auditFocus: focusMode, usage };
}

export async function generateProjectNarrative(projectData) {
    const ai = getClient();
    const modelName = 'gemini-3-flash-preview';
    const prompt = `Synthesize a professional summary for project: ${projectData.title}. Return JSON { "executiveSummary": "string" }.`;
    
    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    const data = cleanJson(response.text) || { executiveSummary: "Diagnostic summary pending." };
    const usage = calculateCost(modelName, response.usageMetadata);
    return { ...data, usage };
}