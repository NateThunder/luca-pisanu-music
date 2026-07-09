import { serveR2Object } from "@/lib/file-assets";
import { getShopBucket } from "@/lib/shop-data";

export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(_request: Request, context: AssetRouteContext) {
  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));
  return serveR2Object(await getShopBucket(), objectKey);
}
