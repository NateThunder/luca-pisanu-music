import { requireAdmin } from "@/lib/admin-auth";
import { isHttpUrl, jsonError, jsonOk, readJson, text, type FieldErrors } from "@/lib/admin-route-utils";
import { getEpkContent, getEpkDatabase, type EpkContent } from "@/lib/epk-data";
import { getMusicReleases } from "@/lib/music-data";

export const dynamic = "force-dynamic";

type EditableEpk = Omit<
  EpkContent,
  "heroImageUrl" | "portraitImageUrl" | "pdfDownloadUrl" | "pdfOriginalFilename"
>;

function required(value: unknown, field: string, errors: FieldErrors) {
  const result = text(value);
  if (!result) errors[field] = "Required.";
  return result;
}

function email(value: unknown, errors: FieldErrors) {
  const result = required(value, "contactEmail", errors);
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    errors.contactEmail = "Enter a valid email address.";
  }
  return result;
}

function url(value: unknown, field: string, errors: FieldErrors) {
  const result = required(value, field, errors);
  if (result && !isHttpUrl(result)) errors[field] = "Enter a valid http or https URL.";
  return result;
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export async function GET(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  return jsonOk({ epk: await getEpkContent() });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const input = await readJson<EditableEpk>(request);
  if (!input) return jsonError("Invalid request body.", 400);

  const errors: FieldErrors = {};
  const fields = {
    heroEyebrow: required(input.heroEyebrow, "heroEyebrow", errors),
    heroTitle: required(input.heroTitle, "heroTitle", errors),
    heroSubtitle: required(input.heroSubtitle, "heroSubtitle", errors),
    positioningLine: required(input.positioningLine, "positioningLine", errors),
    snapshotHeading: required(input.snapshotHeading, "snapshotHeading", errors),
    snapshotBody: list<string>(input.snapshotBody).map(text).filter(Boolean),
    shortBio: required(input.shortBio, "shortBio", errors),
    fullBio: required(input.fullBio, "fullBio", errors),
    biographyQuote: required(input.biographyQuote, "biographyQuote", errors),
    musicHeading: required(input.musicHeading, "musicHeading", errors),
    musicIntro: required(input.musicIntro, "musicIntro", errors),
    riderHeading: required(input.riderHeading, "riderHeading", errors),
    riderInputs: required(input.riderInputs, "riderInputs", errors),
    riderRequirements: required(input.riderRequirements, "riderRequirements", errors),
    riderAdvance: required(input.riderAdvance, "riderAdvance", errors),
    contactHeading: required(input.contactHeading, "contactHeading", errors),
    contactBody: required(input.contactBody, "contactBody", errors),
    contactEmail: email(input.contactEmail, errors),
    websiteUrl: url(input.websiteUrl, "websiteUrl", errors),
    instagramUrl: url(input.instagramUrl, "instagramUrl", errors),
    photoUsageNote: required(input.photoUsageNote, "photoUsageNote", errors),
  };
  if (!fields.snapshotBody.length) errors.snapshotBody = "Add at least one snapshot paragraph.";

  const highlights = list<EpkContent["highlights"][number]>(input.highlights).map((item, index) => ({
    id: text(item.id) || crypto.randomUUID(),
    body: text(item.body),
    sortOrder: (index + 1) * 10,
  }));
  const links = list<EpkContent["links"][number]>(input.links).map((item, index) => ({
    id: text(item.id) || crypto.randomUUID(),
    label: text(item.label),
    url: text(item.url),
    sortOrder: (index + 1) * 10,
  }));
  const quotes = list<EpkContent["quotes"][number]>(input.quotes).map((item, index) => ({
    id: text(item.id) || crypto.randomUUID(),
    quote: text(item.quote),
    source: text(item.source),
    url: text(item.url),
    sortOrder: (index + 1) * 10,
  }));
  const gallery = list<EpkContent["gallery"][number]>(input.gallery).map((item, index) => ({
    id: text(item.id),
    title: text(item.title),
    credit: text(item.credit),
    sortOrder: (index + 1) * 10,
  }));
  const selectedMusicIds = [...new Set(
    list<string>(input.selectedMusicIds).map(text).filter(Boolean),
  )];

  highlights.forEach((item, index) => {
    if (!item.body) errors[`highlight-${index}`] = "Highlight text is required.";
  });
  links.forEach((item, index) => {
    if (!item.label) errors[`link-label-${index}`] = "Link label is required.";
    if (!isHttpUrl(item.url)) errors[`link-url-${index}`] = "Enter a valid URL.";
  });
  quotes.forEach((item, index) => {
    if (!item.quote) errors[`quote-${index}`] = "Quote is required.";
    if (!item.source) errors[`quote-source-${index}`] = "Source is required.";
    if (!isHttpUrl(item.url)) errors[`quote-url-${index}`] = "Enter a valid URL.";
  });
  gallery.forEach((item, index) => {
    if (!item.id || !item.title || !item.credit) {
      errors[`gallery-${index}`] = "Title and photographer credit are required.";
    }
  });
  if (selectedMusicIds.length > 5) {
    errors.selectedMusicIds = "Choose up to five releases.";
  } else if (selectedMusicIds.length) {
    const publishedMusicIds = new Set(
      (await getMusicReleases())
        .filter((release) => release.isAvailable !== false)
        .map((release) => release.id),
    );
    if (selectedMusicIds.some((id) => !publishedMusicIds.has(id))) {
      errors.selectedMusicIds = "Choose published releases from the Music section.";
    }
  }
  if (Object.keys(errors).length) return jsonError("Check the highlighted EPK fields.", 422, errors);

  const db = await getEpkDatabase();
  if (!db) return jsonError("EPK database is not configured.", 503);
  const now = new Date().toISOString();
  try {
    await db.batch([
      db.prepare(
        `UPDATE epk_pages SET
          hero_eyebrow=?, hero_title=?, hero_subtitle=?, positioning_line=?,
          snapshot_heading=?, snapshot_body=?, short_bio=?, full_bio=?, biography_quote=?,
          music_heading=?, music_intro=?, rider_heading=?, rider_inputs=?, rider_requirements=?,
          rider_advance=?, contact_heading=?, contact_body=?, contact_email=?, website_url=?,
          instagram_url=?, photo_usage_note=?, updated_at=? WHERE id='epk'`,
      ).bind(
        fields.heroEyebrow, fields.heroTitle, fields.heroSubtitle, fields.positioningLine,
        fields.snapshotHeading, fields.snapshotBody.join("||"), fields.shortBio, fields.fullBio,
        fields.biographyQuote, fields.musicHeading, fields.musicIntro, fields.riderHeading,
        fields.riderInputs, fields.riderRequirements, fields.riderAdvance, fields.contactHeading,
        fields.contactBody, fields.contactEmail, fields.websiteUrl, fields.instagramUrl,
        fields.photoUsageNote, now,
      ),
      db.prepare("DELETE FROM epk_highlights"),
      ...highlights.map((item) => db.prepare(
        "INSERT INTO epk_highlights (id, body, sort_order, updated_at) VALUES (?, ?, ?, ?)",
      ).bind(item.id, item.body, item.sortOrder, now)),
      db.prepare("DELETE FROM epk_links"),
      ...links.map((item) => db.prepare(
        "INSERT INTO epk_links (id, label, url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?)",
      ).bind(item.id, item.label, item.url, item.sortOrder, now)),
      db.prepare("DELETE FROM epk_quotes"),
      ...quotes.map((item) => db.prepare(
        "INSERT INTO epk_quotes (id, quote_text, source, url, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).bind(item.id, item.quote, item.source, item.url, item.sortOrder, now)),
      db.prepare("DELETE FROM epk_music_selection"),
      ...selectedMusicIds.map((releaseId, index) => db.prepare(
        "INSERT INTO epk_music_selection (release_id, sort_order, updated_at) VALUES (?, ?, ?)",
      ).bind(releaseId, (index + 1) * 10, now)),
      ...gallery.map((item) => db.prepare(
        "UPDATE epk_gallery SET title=?, credit=?, sort_order=?, updated_at=? WHERE id=?",
      ).bind(item.title, item.credit, item.sortOrder, now, item.id)),
    ]);
    return jsonOk({ epk: await getEpkContent() });
  } catch {
    return jsonError("Run the latest About database migration before editing the EPK.", 503);
  }
}
