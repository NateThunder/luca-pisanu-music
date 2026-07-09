import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AboutPageContent = {
  eyebrow: string;
  heading: string;
  highlight: string;
  body: string[];
};

type AboutPageRow = {
  id: string;
  eyebrow: string;
  heading: string;
  highlight_text: string;
};

type AboutBodyBlockRow = {
  body: string;
};

export const fallbackAboutPageContent: AboutPageContent = {
  eyebrow: "The artist",
  heading: "About",
  highlight:
    '"I\'m a dot in the middle of nothing, but in my nothing I can achieve everything."',
  body: [
    "Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist based in Glasgow, UK.",
    "Drawn to music from an early age, he began playing guitar at eight. That first instrument set him on a journey through a wide range of genres and turned a childhood passion into his life's focus.",
    "Influenced by artists including Stevie Wonder, Stevie Ray Vaughan and Jimi Hendrix, Luca creates eclectic, deeply expressive music rooted in blues, soul, jazz, funk and neo-soul.",
    "After performing with several projects across the UK, Italy and France, Luca began exploring his solo career and developing the groovy, suave sound that has come to define his work.",
    "His wider work has included playing bass for Tom McGuire and the Brassholes, guitar for Charlotte Marshall and the 45s, and working as an in-demand session musician in Glasgow.",
    "Warm vocals, melodic guitars and engaging bass lines make Luca Pisanu an artist to watch.",
  ],
};

export async function getAboutDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.ABOUT_DB ?? null;
  } catch {
    return null;
  }
}

export async function getAboutPageContent() {
  const db = await getAboutDatabase();
  if (!db) return fallbackAboutPageContent;

  try {
    const page = await db
      .prepare(
        `SELECT id,
                eyebrow,
                heading,
                highlight_text
         FROM about_pages
         WHERE id = ? AND is_published = 1`,
      )
      .bind("about")
      .first<AboutPageRow>();

    if (!page) return fallbackAboutPageContent;

    const blocks = await db
      .prepare(
        `SELECT body
         FROM about_body_blocks
         WHERE page_id = ?
         ORDER BY sort_order ASC`,
      )
      .bind(page.id)
      .all<AboutBodyBlockRow>();

    const body = (blocks.results ?? []).map((block) => block.body);

    return {
      eyebrow: page.eyebrow,
      heading: page.heading,
      highlight: page.highlight_text,
      body: body.length > 0 ? body : fallbackAboutPageContent.body,
    };
  } catch {
    return fallbackAboutPageContent;
  }
}
