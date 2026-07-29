import { safeDownloadName } from "@/lib/epk-assets";
import { getEpkBucket, getEpkDatabase } from "@/lib/epk-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const [db, bucket] = await Promise.all([getEpkDatabase(), getEpkBucket()]);
  if (!db || !bucket) return new Response("Not found.", { status: 404 });
  const page = await db.prepare(
    "SELECT pdf_key, pdf_original_filename FROM epk_pages WHERE id='epk'",
  ).first<{ pdf_key: string | null; pdf_original_filename: string | null }>();
  if (!page?.pdf_key) return new Response("Not found.", { status: 404 });
  const object = await bucket.get(page.pdf_key);
  if (!object) return new Response("Not found.", { status: 404 });
  const filename = safeDownloadName(page.pdf_original_filename || "Luca-Pisanu-EPK.pdf", "Luca-Pisanu-EPK.pdf");
  return new Response(object.body, {
    headers: {
      "content-type": "application/pdf",
      "content-length": String(object.size),
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=300",
    },
  });
}
