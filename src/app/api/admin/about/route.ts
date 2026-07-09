import { fallbackAboutPageContent, getAboutDatabase } from "@/lib/about-data";
import { requireAdmin } from "@/lib/admin-auth";
import { jsonError, jsonOk, readJson, text, type FieldErrors } from "@/lib/admin-route-utils";

export const dynamic = "force-dynamic";

type AboutBody = {
  eyebrow?: unknown;
  heading?: unknown;
  highlight?: unknown;
  bodyText?: unknown;
};

type AboutPageRow = {
  id: string;
  eyebrow: string;
  heading: string;
  highlight_text: string;
  is_published: number;
  created_at: string;
  updated_at: string;
};

type AboutBodyBlockRow = {
  body: string;
};

async function getAdminAboutContent(db: D1Database) {
  const page = await db
    .prepare(
      `SELECT id,
              eyebrow,
              heading,
              highlight_text,
              is_published,
              created_at,
              updated_at
       FROM about_pages
       WHERE id = ?
       LIMIT 1`,
    )
    .bind("about")
    .first<AboutPageRow>();

  if (!page) {
    return {
      ...fallbackAboutPageContent,
      bodyText: fallbackAboutPageContent.body.join("\n\n"),
      isVisible: true,
      updatedAt: "",
    };
  }

  const blocks = await db
    .prepare(
      `SELECT body
       FROM about_body_blocks
       WHERE page_id = ?
       ORDER BY sort_order ASC`,
    )
    .bind("about")
    .all<AboutBodyBlockRow>();
  const body = (blocks.results ?? []).map((block) => block.body);

  return {
    eyebrow: page.eyebrow,
    heading: page.heading,
    highlight: page.highlight_text,
    body: body.length ? body : fallbackAboutPageContent.body,
    bodyText: (body.length ? body : fallbackAboutPageContent.body).join("\n\n"),
    isVisible: page.is_published === 1,
    updatedAt: page.updated_at,
  };
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const db = await getAboutDatabase();
  if (!db) return jsonError("About database is not configured.", 503);

  return jsonOk({ about: await getAdminAboutContent(db) });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await readJson<AboutBody>(request);
  if (!body) return jsonError("Invalid request body.", 400);

  const errors: FieldErrors = {};
  const eyebrow = text(body.eyebrow);
  const heading = text(body.heading);
  const highlight = text(body.highlight);
  const paragraphs = text(body.bodyText)
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!eyebrow) errors.eyebrow = "Eyebrow is required.";
  if (!heading) errors.heading = "Header is required.";
  if (!highlight) errors.highlight = "Yellow subheader text is required.";
  if (!paragraphs.length) errors.bodyText = "Main bio is required.";

  if (Object.keys(errors).length) {
    return jsonError("Check the highlighted fields.", 422, errors);
  }

  const db = await getAboutDatabase();
  if (!db) return jsonError("About database is not configured.", 503);

  const updatedAt = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `INSERT INTO about_pages (
          id,
          eyebrow,
          heading,
          highlight_text,
          is_published,
          updated_at
        ) VALUES (?, ?, ?, ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET
          eyebrow = excluded.eyebrow,
          heading = excluded.heading,
          highlight_text = excluded.highlight_text,
          is_published = excluded.is_published,
          updated_at = excluded.updated_at`,
      )
      .bind("about", eyebrow, heading, highlight, updatedAt),
    db.prepare(`DELETE FROM about_body_blocks WHERE page_id = ?`).bind("about"),
    ...paragraphs.map((paragraph, index) =>
      db
        .prepare(
          `INSERT INTO about_body_blocks (
            id,
            page_id,
            sort_order,
            body,
            updated_at
          ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(`about-body-${index + 1}`, "about", (index + 1) * 10, paragraph, updatedAt),
    ),
  ]);

  return jsonOk({ about: await getAdminAboutContent(db) });
}
