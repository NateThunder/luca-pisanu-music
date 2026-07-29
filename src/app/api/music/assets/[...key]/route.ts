import { serveR2Object } from "@/lib/file-assets";
import { getMusicBucket } from "@/lib/music-data";

export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(request: Request, context: AssetRouteContext) {
  const bucket = await getMusicBucket();
  if (!bucket) {
    return new Response("Music storage is not configured.", { status: 503 });
  }

  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));
  return serveR2Object(bucket, objectKey, request);
}
