import { getCloudflareContext } from "@opennextjs/cloudflare";
import { imageAssetUrl } from "@/lib/file-assets";

export type EpkListItem = { id: string; body: string; sortOrder: number };
export type EpkLink = { id: string; label: string; url: string; sortOrder: number };
export type EpkQuote = {
  id: string;
  quote: string;
  source: string;
  url: string;
  sortOrder: number;
};
export type EpkGalleryItem = {
  id: string;
  title: string;
  credit: string;
  previewUrl: string;
  downloadUrl: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  sortOrder: number;
};

export type EpkContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  positioningLine: string;
  snapshotHeading: string;
  snapshotBody: string[];
  shortBio: string;
  fullBio: string;
  biographyQuote: string;
  musicHeading: string;
  musicIntro: string;
  riderHeading: string;
  riderInputs: string;
  riderRequirements: string;
  riderAdvance: string;
  contactHeading: string;
  contactBody: string;
  contactEmail: string;
  websiteUrl: string;
  instagramUrl: string;
  photoUsageNote: string;
  heroImageUrl: string;
  portraitImageUrl: string;
  pdfDownloadUrl: string;
  pdfOriginalFilename: string;
  highlights: EpkListItem[];
  links: EpkLink[];
  quotes: EpkQuote[];
  gallery: EpkGalleryItem[];
  selectedMusicIds: string[];
};

type PageRow = {
  hero_eyebrow: string; hero_title: string; hero_subtitle: string;
  positioning_line: string; snapshot_heading: string; snapshot_body: string;
  short_bio: string; full_bio: string; biography_quote: string;
  music_heading: string; music_intro: string; rider_heading: string;
  rider_inputs: string; rider_requirements: string; rider_advance: string;
  contact_heading: string; contact_body: string; contact_email: string;
  website_url: string; instagram_url: string; photo_usage_note: string;
  hero_image_key: string | null; portrait_image_key: string | null;
  pdf_key: string | null;
  pdf_original_filename: string | null;
};

type HighlightRow = { id: string; body: string; sort_order: number };
type LinkRow = { id: string; label: string; url: string; sort_order: number };
type QuoteRow = { id: string; quote_text: string; source: string; url: string; sort_order: number };
export type GalleryRow = {
  id: string; title: string; credit: string; image_key: string;
  original_filename: string; content_type: string; size_bytes: number; sort_order: number;
};

export const fallbackEpkContent: EpkContent = {
  heroEyebrow: "Electronic press kit",
  heroTitle: "Luca Pisanu",
  heroSubtitle: "Singer-songwriter / Composer / Producer / Multi-instrumentalist",
  positioningLine: "Soul in the pocket. Songs with teeth.",
  snapshotHeading: "Artist snapshot",
  snapshotBody: [
    "Sardinian-born and Glasgow-based, Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist whose sound moves through blues, soul, jazz, funk and neo-soul.",
    "A guitarist since the age of eight, he pairs warm vocals with melodic guitar work and bass lines built for the body. His solo material carries the instincts of a seasoned collaborator: arrangement-first, groove-led and alive to the room.",
  ],
  shortBio: "Luca Pisanu is a Sardinian singer-songwriter, producer and multi-instrumentalist based in Glasgow. Rooted in blues, soul, jazz, funk and neo-soul, his music joins warm vocals, expressive guitar and deep-pocket bass with a producer's ear for shape and detail.",
  fullBio: "Drawn to music early, Luca began guitar at eight and followed that spark through an eclectic musical education shaped by Stevie Wonder, Stevie Ray Vaughan and Jimi Hendrix. After performing across the UK, Italy and France, he developed a solo voice that is groovy, suave and emotionally direct. Alongside his own work, Luca has become a familiar presence in Glasgow's adventurous soul and jazz ecosystem - playing bass with Tom McGuire & the Brassholes, performing with Mercury Prize-nominated jazz collective corto.alto, working on guitar with Charlotte Marshall and the 45s, contributing as a session musician, and hosting jam sessions that connect players and audiences. Whether fronting a solo set or locking into an ensemble, he brings musicianship without stiffness and sophistication without losing the song.",
  biographyQuote: "Groove-led, expressive and alive to the room.",
  musicHeading: "Start here.",
  musicIntro: "Releases, audio and current platform links live on Luca's official website.",
  riderHeading: "Trio stage plan.",
  riderInputs: "CH 1-N: venue-selected multi-mic drum package. CH N+1: guitar amp mic (SM57 or equivalent). CH N+2: bass amp mic (SM57 or equivalent). CH N+3: Luca lead vocal (SM58 or equivalent). CH N+4: bass backing vocal (SM58 or equivalent). CH N+5: drummer backing vocal (SM58 or equivalent). All microphone lines use balanced XLR.",
  riderRequirements: "Three boom vocal stands; suitable drum and amp mic stands/clips; three independent wedge mixes; stage box with the required inputs and three returns; four clean 230V AC drops at drums, guitar amp, guitar pedalboard, and the combined bass backline/pedalboard zone; safe cable runs. Guitar and bass use 1/4-inch TS instrument/pedal/amp connections. Active wedges use XLR returns; passive wedges use venue amplification and NL4.",
  riderAdvance: "Audience view: drums left, Luca centre, bass right. Mix 1 drums: lead vocal, drummer backing vocal, bass and guitar, with kick as required. Mix 2 Luca: lead vocal prominent, guitar, both backing vocals, with bass/kick as required. Mix 3 bass: bass backing vocal and lead vocal prominent, bass, guitar and kick as required. Final levels and the drum microphone package are agreed at soundcheck.",
  contactHeading: "Book. Feature. Collaborate.",
  contactBody: "Music, collaborations, sessions, live enquiries and press.",
  contactEmail: "lucapisanumusic@gmail.com",
  websiteUrl: "https://lucapisanumusic.com",
  instagramUrl: "https://www.instagram.com/lucapisanumusic/",
  photoUsageNote: "For editorial and promotional use in connection with Luca Pisanu. Please credit the photographer where supplied.",
  heroImageUrl: "/luca-guitar-live.png",
  portraitImageUrl: "/luca-standing-smiling.png",
  pdfDownloadUrl: "/LUCA-PISANU-EPK-REVISED-JULY-2026.pdf",
  pdfOriginalFilename: "LUCA-PISANU-EPK-REVISED-JULY-2026.pdf",
  highlights: [
    { id: "corto-alto-bad-with-names", body: "Featured on corto.alto Mercury Prize nominated album Bad With Names", sortOrder: 10 },
    { id: "glastonbury-west-holts", body: "Played Glastonbury West Holts Stage for a 25k+ audience", sortOrder: 20 },
    { id: "world-class-festivals", body: "We Out There main stage, Cross the Tracks, Love Supreme and other world-class festivals", sortOrder: 30 },
    { id: "glasgow-barrowland", body: "Performed at sold-out Glasgow Barrowland Ballroom shows attended by 2k+ people", sortOrder: 40 },
    { id: "glasgow-music-scene", body: "Featured at Glasgow Jazz festival, Celtic Connections and active in Glasgow’s music scene", sortOrder: 50 },
  ],
  links: [
    { id: "music", label: "Official music page", url: "https://lucapisanumusic.com/music", sortOrder: 10 },
    { id: "no-time-for-love", label: "No Time For Love - official video", url: "https://www.youtube.com/watch?v=WmWasQXIhi0", sortOrder: 20 },
    { id: "youtube", label: "YouTube channel", url: "https://www.youtube.com/@lucapisanumusic", sortOrder: 30 },
    { id: "apple-music", label: "Apple Music", url: "https://music.apple.com/gb/artist/luca-pisanu/497386712", sortOrder: 40 },
    { id: "tidal", label: "Tidal", url: "https://tidal.com/artist/19084237", sortOrder: 50 },
    { id: "instagram", label: "Instagram", url: "https://www.instagram.com/lucapisanumusic/", sortOrder: 60 },
  ],
  quotes: [
    { id: "barrowland", quote: "Over 1,900 people gathered for a massive party ... the band truly set the place on fire.", source: "is this music? - Celtic Connections, Barrowland Ballroom", url: "https://www.isthismusic.com/tom-mcguire-the-brassholes-cara-rose-bohemian-monk-machine", sortOrder: 10 },
    { id: "made-in-glasgow", quote: "Providing the backbone are Luca Pisanu on bass and James Mackay on guitar.", source: "is this music? - corto.alto + friends: Made in Glasgow", url: "https://www.isthismusic.com/corto-alto-friends-made-in-glasgow", sortOrder: 20 },
    { id: "glasgow-jazz", quote: "A Sardinian multi instrumentalist and well seasoned Glasgow musician.", source: "Glasgow Jazz Festival artist listing", url: "https://www.jazzfest.co.uk/venues/green-room", sortOrder: 30 },
    { id: "hifi-pig", quote: "The funk ... in great big huge buckets labelled EXTRA FUNKY FUNK.", source: "HiFi Pig - Tom McGuire & the Brassholes live", url: "https://www.hifipig.com/tom-mcguire-the-brassholes-the-voodoo-rooms-edinburgh/", sortOrder: 40 },
  ],
  gallery: [],
  selectedMusicIds: [],
};

export async function getEpkDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.ABOUT_DB ?? null;
  } catch {
    return null;
  }
}

export async function getEpkBucket() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_BUCKET ?? null;
  } catch {
    return null;
  }
}

function galleryItem(row: GalleryRow): EpkGalleryItem {
  return {
    id: row.id,
    title: row.title,
    credit: row.credit,
    previewUrl: `/api/epk/assets/${encodeURIComponent(row.image_key)}`,
    downloadUrl: `/api/epk/gallery/${encodeURIComponent(row.id)}/download`,
    originalFilename: row.original_filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    sortOrder: row.sort_order,
  };
}

export async function getEpkContent(): Promise<EpkContent> {
  const db = await getEpkDatabase();
  if (!db) return fallbackEpkContent;
  try {
    const [page, highlights, links, quotes, gallery, musicSelection] = await Promise.all([
      db.prepare("SELECT * FROM epk_pages WHERE id = ?").bind("epk").first<PageRow>(),
      db.prepare("SELECT id, body, sort_order FROM epk_highlights ORDER BY sort_order, id").all<HighlightRow>(),
      db.prepare("SELECT id, label, url, sort_order FROM epk_links ORDER BY sort_order, id").all<LinkRow>(),
      db.prepare("SELECT id, quote_text, source, url, sort_order FROM epk_quotes ORDER BY sort_order, id").all<QuoteRow>(),
      db.prepare(
        `SELECT id, title, credit, image_key, original_filename, content_type, size_bytes, sort_order
         FROM epk_gallery ORDER BY sort_order, created_at`,
      ).all<GalleryRow>(),
      db.prepare("SELECT release_id FROM epk_music_selection ORDER BY sort_order, release_id")
        .all<{ release_id: string }>()
        .catch(() => ({ results: [] as { release_id: string }[] })),
    ]);
    if (!page) return fallbackEpkContent;
    return {
      heroEyebrow: page.hero_eyebrow,
      heroTitle: page.hero_title,
      heroSubtitle: page.hero_subtitle,
      positioningLine: page.positioning_line,
      snapshotHeading: page.snapshot_heading,
      snapshotBody: page.snapshot_body.split("||").filter(Boolean),
      shortBio: page.short_bio,
      fullBio: page.full_bio,
      biographyQuote: page.biography_quote,
      musicHeading: page.music_heading,
      musicIntro: page.music_intro,
      riderHeading: page.rider_heading,
      riderInputs: page.rider_inputs,
      riderRequirements: page.rider_requirements,
      riderAdvance: page.rider_advance,
      contactHeading: page.contact_heading,
      contactBody: page.contact_body,
      contactEmail: page.contact_email,
      websiteUrl: page.website_url,
      instagramUrl: page.instagram_url,
      photoUsageNote: page.photo_usage_note,
      heroImageUrl: imageAssetUrl("/api/epk/assets", page.hero_image_key) ?? fallbackEpkContent.heroImageUrl,
      portraitImageUrl: imageAssetUrl("/api/epk/assets", page.portrait_image_key) ?? fallbackEpkContent.portraitImageUrl,
      pdfDownloadUrl: page.pdf_key ? "/api/epk/download" : fallbackEpkContent.pdfDownloadUrl,
      pdfOriginalFilename: page.pdf_original_filename ?? fallbackEpkContent.pdfOriginalFilename,
      highlights: (highlights.results ?? []).map((item) => ({ id: item.id, body: item.body, sortOrder: item.sort_order })),
      links: (links.results ?? []).map((item) => ({ id: item.id, label: item.label, url: item.url, sortOrder: item.sort_order })),
      quotes: (quotes.results ?? []).map((item) => ({ id: item.id, quote: item.quote_text, source: item.source, url: item.url, sortOrder: item.sort_order })),
      gallery: (gallery.results ?? []).map(galleryItem),
      selectedMusicIds: (musicSelection.results ?? []).map((item) => item.release_id),
    };
  } catch {
    return fallbackEpkContent;
  }
}
