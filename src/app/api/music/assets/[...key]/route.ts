import { getMusicBucket } from "@/lib/music-data";

export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(_request: Request, context: AssetRouteContext) {
  const bucket = await getMusicBucket();
  if (!bucket) {
    return new Response("Music storage is not configured.", { status: 503 });
  }

  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));
  const object = await bucket.get(objectKey);

  if (!object) return new Response("Not found.", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
