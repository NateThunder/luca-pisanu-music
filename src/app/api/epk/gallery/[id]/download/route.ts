import { safeDownloadName } from "@/lib/epk-assets";
import { getEpkBucket, getEpkDatabase } from "@/lib/epk-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [db, bucket] = await Promise.all([getEpkDatabase(), getEpkBucket()]);
  if (!db || !bucket) return new Response("Not found.", { status: 404 });
  const item = await db.prepare(
    "SELECT image_key, original_filename, content_type FROM epk_gallery WHERE id=?",
  ).bind(id).first<{ image_key: string; original_filename: string; content_type: string }>();
  if (!item) return new Response("Not found.", { status: 404 });
  const object = await bucket.get(item.image_key);
  if (!object) return new Response("Not found.", { status: 404 });
  const filename = safeDownloadName(item.original_filename, "Luca-Pisanu-press-photo");
  return new Response(object.body, {
    headers: {
      "content-type": item.content_type,
      "content-length": String(object.size),
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=300",
    },
  });
}
