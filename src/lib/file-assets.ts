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

function requestedByteRange(value: string, size: number): R2Range | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    return { offset: Math.max(size - suffix, 0), length: Math.min(suffix, size) };
  }

  const offset = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : size - 1;
  if (
    !Number.isSafeInteger(offset) ||
    !Number.isSafeInteger(requestedEnd) ||
    offset < 0 ||
    requestedEnd < offset ||
    offset >= size
  ) {
    return null;
  }

  return {
    offset,
    length: Math.min(requestedEnd, size - 1) - offset + 1,
  };
}

export async function serveR2Object(
  bucket: R2Bucket | null,
  key: string,
  request?: Request,
) {
  if (!bucket) {
    return new Response("Storage is not configured.", { status: 503 });
  }

  const rangeHeader = request?.headers.get("range");
  let range: R2Range | undefined;

  if (rangeHeader) {
    const metadata = await bucket.head(key);
    if (!metadata) return new Response("Not found.", { status: 404 });

    const parsedRange = requestedByteRange(rangeHeader, metadata.size);
    if (!parsedRange) {
      return new Response(null, {
        status: 416,
        headers: { "content-range": `bytes */${metadata.size}` },
      });
    }
    range = parsedRange;
  }

  const object = await bucket.get(key, range ? { range } : undefined);
  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  const metadata = object.httpMetadata;
  if (metadata?.contentType) headers.set("content-type", metadata.contentType);
  if (metadata?.contentLanguage) headers.set("content-language", metadata.contentLanguage);
  if (metadata?.contentDisposition) headers.set("content-disposition", metadata.contentDisposition);
  if (metadata?.contentEncoding) headers.set("content-encoding", metadata.contentEncoding);
  if (metadata?.cacheControl) headers.set("cache-control", metadata.cacheControl);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }

  if (range && "offset" in range && range.offset !== undefined && range.length !== undefined) {
    const end = range.offset + range.length - 1;
    headers.set("content-range", `bytes ${range.offset}-${end}/${object.size}`);
    headers.set("content-length", String(range.length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("content-length", String(object.size));
  return new Response(object.body, { headers });
}
