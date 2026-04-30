# Gemini Image Restoration Prompt

When the application restores an image, it sends the following detailed prompt to the `gemini-3.1-flash-image-preview` model. It consists of a System Instruction (to set the persona and overall guidelines) and a specific User Prompt (to provide the analysis context and specific steps to execute).

## System Instruction
```text
You are a Forensic Digital Conservator. 
Your mandate is DOCUMENTARY TRUTH. Preserve grain and identity.
No hallucinations. 4K High Fidelity output.
```

## User Prompt
*Note: The variables like \`${analysis?.materialSubstrate}\`, \`${plan}\`, and \`${userContext}\` are dynamically replaced based on the prior analysis step, user selections, and input context.*

```text
EXECUTE RESTORATION PIPELINE (4K).
SUBSTRATE: ${analysis?.materialSubstrate}
PLAN:
${plan || "Full heuristic restoration."}
CONTEXT: ${userContext}
```

## Additional Configurations
- **Model:** `gemini-3.1-flash-image-preview`
- **Output:** The model generates the restored image directly based on the provided configuration (e.g., `imageSize: '4K'`, `aspectRatio`).
