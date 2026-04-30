export const MODELS = {
  // Gemini 3 Pro for "Forensic Conservator" (Brain)
  DIAGNOSIS: 'gemini-3-pro-preview',
  // Gemini 3 Pro Image (Nano Banana Pro) for "Digital Restorer" (Hands)
  RESTORATION: 'gemini-3-pro-image-preview', 
};

export const SYSTEM_INSTRUCTION_DIAGNOSIS = `
You are a professional forensic photograph conservator with expertise in material archaeology.
Your goal is to analyze an image, identify its historical format (e.g., Daguerreotype, Albumen, Silver Gelatin), and diagnose specific defects (silver mirroring, foxing, tears, fading).
You must output a structured repair plan.
`;

export const DIAGNOSTIC_PROMPT = `
Analyze this image. 
1. Identify the physical substrate and likely era.
2. List specific defects (Physical, Chemical, Biological).
3. Create a step-by-step restoration plan (The "AgenticIR" Workflow).
4. Provide a trust assessment.

Return ONLY valid JSON matching this schema:
{
  "historicalEra": "string",
  "materialSubstrate": "string",
  "conditionRating": number,
  "defects": [
    { "type": "string", "location": "string", "severity": "string" }
  ],
  "restorationPlan": [
    { "id": "string", "type": "physical|chemical|digital", "description": "string", "priority": "high|medium|low", "tool": "string", "status": "pending" }
  ]
}
`;