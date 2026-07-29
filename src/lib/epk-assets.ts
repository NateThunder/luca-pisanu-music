const browserImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

export const maxEpkImageBytes = 25 * 1024 * 1024;
export const maxEpkPdfBytes = 50 * 1024 * 1024;

export function safeDownloadName(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
  return cleaned || fallback;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export async function validateBrowserImage(file: File) {
  if (!browserImageTypes.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, AVIF, or GIF image.");
  }
  if (file.size <= 0 || file.size > maxEpkImageBytes) {
    throw new Error("Choose an image no larger than 25 MB.");
  }

  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const valid =
    (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (file.type === "image/png" && ascii(bytes, 1, 3) === "PNG") ||
    (file.type === "image/gif" && ["GIF87a", "GIF89a"].includes(ascii(bytes, 0, 6))) ||
    (file.type === "image/webp" && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") ||
    (file.type === "image/avif" && ascii(bytes, 4, 4) === "ftyp" && /avi[fs]/.test(ascii(bytes, 8, 16)));

  if (!valid) throw new Error("The image contents do not match the selected file type.");
}

export async function validatePdf(file: File) {
  if (file.type !== "application/pdf") throw new Error("Choose a PDF file.");
  if (file.size <= 0 || file.size > maxEpkPdfBytes) {
    throw new Error("Choose a PDF no larger than 50 MB.");
  }
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (ascii(bytes, 0, 5) !== "%PDF-") {
    throw new Error("The selected file is not a valid PDF.");
  }
}

export function extensionForEpkFile(file: File) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return byType[file.type] ?? "bin";
}

export async function putEpkFile(bucket: R2Bucket, prefix: string, file: File) {
  const key = `${prefix}/${crypto.randomUUID()}.${extensionForEpkFile(file)}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalFilename: safeDownloadName(file.name, "asset") },
  });
  return key;
}
