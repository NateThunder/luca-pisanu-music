const imageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function imageAssetUrl(basePath: string, key: string | null) {
  return key ? `${basePath}/${encodeURIComponent(key)}` : null;
}

export function getFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File ? value : null;
}

export function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "bin";
}

export async function putImageFile(
  bucket: R2Bucket,
  keyPrefix: string,
  field: string,
  file: File | null,
  required = false,
) {
  if (!file || file.size === 0) {
    if (required) throw new Error(`${field} is required.`);
    return null;
  }

  if (!imageTypes.has(file.type)) {
    throw new Error(`${field} has an unsupported file type.`);
  }

  const key = `${keyPrefix}/${field}.${extensionFor(file)}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return key;
}

export async function serveR2Object(bucket: R2Bucket | null, key: string) {
  if (!bucket) {
    return new Response("Storage is not configured.", { status: 503 });
  }

  const object = await bucket.get(key);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
