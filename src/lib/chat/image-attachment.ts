/**
 * Client-side helpers for converting a picked `File` into an
 * Anthropic-friendly inline data URL. Resizes large images before encoding
 * so a 5-megapixel phone photo doesn't end up as a 12 MB request body.
 */

/**
 * Longest edge (pixels) we downscale to before base64-encoding. Matches
 * Anthropic's recommended max for vision inputs — larger images are resized
 * server-side anyway, so shipping bigger just wastes bandwidth and tokens.
 *
 * Units: pixels.
 * Range: 512–4096. Practical: 1024–2048.
 * - Lower  → smaller request bodies and lower input-token cost, but screenshots
 *            of dense UI may lose legibility.
 * - Higher → better fidelity for design reviews, but quickly overshoots the
 *            10 MB per-attachment ceiling enforced in request-schema.ts.
 */
const MAX_EDGE_PX = 2048;

/**
 * JPEG quality used when re-encoding non-PNG/GIF/WebP inputs. 0.85 is a
 * widely-used "visually indistinguishable" sweet spot; the relationship
 * between quality and file size is highly non-linear below ~0.75.
 *
 * Units: canvas.toDataURL quality (0–1).
 * Range: 0.6–0.95. Practical: 0.8–0.9.
 * - Lower  → smaller payload, visible compression artifacts in screenshots.
 * - Higher → diminishing returns on quality, rapidly growing file size.
 */
const JPEG_QUALITY = 0.85;

/**
 * MIME types we keep as-is. GIF/WebP are already well-compressed and SVG is
 * vector (re-encoding to JPEG would rasterize it and destroy fidelity).
 */
const PASSTHROUGH_MIMES = new Set(["image/gif", "image/webp", "image/svg+xml"]);

export interface ImageAttachment {
  /** `data:<mime>;base64,...` URL ready to drop into an AI SDK `file` part. */
  dataUrl: string;
  /** Best-effort MIME type (`image/png`, `image/jpeg`, ...). */
  mediaType: string;
  /** Original filename from the picker/paste, used for the preview label. */
  filename: string;
}

/**
 * Convert a browser `File` to a resized data URL suitable for sending to
 * Claude via the AI SDK's `file` part. Falls back to the original bytes if
 * decoding fails (e.g. exotic format, offline canvas tainting).
 */
export async function fileToImageAttachment(
  file: File
): Promise<ImageAttachment> {
  const filename = file.name || "attachment";

  // For formats that don't round-trip well through a `<canvas>` (SVG) or
  // where re-encoding loses information (GIF, WebP animations), just hand
  // the original bytes back as a data URL.
  if (PASSTHROUGH_MIMES.has(file.type)) {
    const dataUrl = await readAsDataURL(file);
    return { dataUrl, mediaType: file.type, filename };
  }

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = scaleToFit(bitmap.width, bitmap.height, MAX_EDGE_PX);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(bitmap, 0, 0, width, height);
    // If the source was PNG we keep it PNG so transparency is preserved;
    // anything else rides the JPEG path at `JPEG_QUALITY` to save bytes.
    const outMime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(
      outMime,
      outMime === "image/jpeg" ? JPEG_QUALITY : undefined
    );
    return { dataUrl, mediaType: outMime, filename };
  } catch {
    // Degrade gracefully — send the original file; the server-side size
    // guard will still reject it if it's genuinely too large.
    const dataUrl = await readAsDataURL(file);
    return { dataUrl, mediaType: file.type || "image/png", filename };
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // `createImageBitmap` is faster + GC-friendlier but not universally
  // available for every codec; fall back to an `<img>` when it throws.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function scaleToFit(
  srcW: number,
  srcH: number,
  maxEdge: number
): { width: number; height: number } {
  const longest = Math.max(srcW, srcH);
  if (longest <= maxEdge) return { width: srcW, height: srcH };
  const ratio = maxEdge / longest;
  return {
    width: Math.round(srcW * ratio),
    height: Math.round(srcH * ratio),
  };
}
