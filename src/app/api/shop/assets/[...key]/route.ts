import { serveR2Object } from "@/lib/file-assets";
import { getShopBucket } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(request: Request, context: AssetRouteContext) {
  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));
  if (objectKey.startsWith("digital/")) {
    return new Response("Not found", { status: 404 });
  }
  return serveR2Object(await getShopBucket(), objectKey, request);
}
