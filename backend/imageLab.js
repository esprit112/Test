
import sharp from 'sharp';

/**
 * Validates image metadata.
 */
export async function validateImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return metadata;
  } catch (error) {
    throw new Error("Invalid image data. Please upload a valid image file.");
  }
}

/**
 * Creates a smaller proxy image for UI thumbnails or quick analysis.
 */
export async function createProxy(buffer, width = 1024) {
  return await sharp(buffer)
    .resize(width, null, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

/**
 * Optimizes image for Generative AI ingestion.
 * Converts to JPEG to reduce base64 string size significantly, preventing 'fetch failed' errors.
 * Keeps resolution high but manages compression.
 */
export async function optimizeForModel(buffer) {
  return await sharp(buffer)
    .jpeg({ quality: 95, mozjpeg: true }) // Increased to 95 for maximum fidelity
    .toBuffer();
}

/**
 * Optimizes images for the PDF report (smaller size).
 */
export async function optimizeForReport(buffer) {
  return await sharp(buffer)
    .resize(600, null, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .jpeg({ quality: 60 })
    .toBuffer();
}
