import { serveR2Object } from "@/lib/file-assets";
import { getEpkBucket } from "@/lib/epk-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }) {
  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));
  if (!objectKey.startsWith("epk/")) return new Response("Not found.", { status: 404 });
  return serveR2Object(await getEpkBucket(), objectKey, request);
}
