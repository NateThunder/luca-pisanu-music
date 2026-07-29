export type NavItem = {
  label: string;
  href: string;
};

export type ExternalDestination = {
  label: string;
  href: string | null;
  ariaLabel?: string;
};

export type Release = {
  id: string;
  title: string;
  description: string;
  releaseType?: "ALBUM" | "EP" | "SINGLE";
  isAvailable?: boolean;
  artwork: "portrait" | "tower" | "guitar" | "waves";
  coverArtUrl?: string | null;
  coverArtAlt?: string | null;
  audioUrl?: string | null;
  listenUrl: string | null;
  supportUrl: string | null;
  purchaseProductId?: string | null;
  purchasePriceGbp?: number | null;
  purchasePrices?: Record<CurrencyCode, number> | null;
  isForSale?: boolean;
  digitalFormats?: Array<"mp3" | "wav">;
  streamingLinks?: {
    spotify?: string | null;
    appleMusic?: string | null;
    tidal?: string | null;
    youtube?: string | null;
    soundcloud?: string | null;
    bandcamp?: string | null;
  };
};

export type Video = {
  id: string;
  title: string;
  note: string;
  imageSlot: "hat" | "standing" | "live";
  url: string | null;
  thumbnailUrl?: string | null;
};

export type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  options: Record<string, string>;
  stockQuantity: number;
  isAvailable: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  note: string;
  description: string;
  prices: Record<CurrencyCode, number>;
  status: string;
  artwork: "vinyl" | "book" | "shirt" | "session";
  frontArtworkUrl?: string | null;
  backArtworkUrl?: string | null;
  artworkAlt?: string | null;
  saleMode?: "purchase" | "enquiry" | "unavailable";
  trackInventory?: boolean;
  stockQuantity?: number;
  variants?: ProductVariant[];
  productType?: "physical" | "digital";
  digitalFormats?: Array<"mp3" | "wav">;
  videoAvailable?: boolean;
};

export type LiveGig = {
  city: string;
  date: string;
  event: string;
  venue: string;
  link: string | null;
  linkLabel: string;
};

export type CurrencyCode = "GBP" | "EUR" | "USD";

export type InquiryType =
  | "music"
  | "lessons"
  | "collaboration"
  | "press"
  | "other";

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Music", href: "/music" },
  { label: "Live", href: "/live" },
  { label: "About", href: "/about" },
  { label: "Videos", href: "/videos" },
  { label: "EPK", href: "/epk" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

export const heroLines = [
  "Luca Pisanu",
];

export const heroRoles = [
  "Singer & Songwriter",
  "Composer & Producer",
  "Multi-Instrumentalist",
];

export const releases: Release[] = [
  {
    id: "all-in-good-time",
    title: "All In Good Time",
    description: "A soulful journey through groove, melody and late-night thoughts.",
    artwork: "portrait",
    listenUrl: null,
    supportUrl: null,
  },
  {
    id: "keep-climbing",
    title: "Keep Climbing",
    description: "An uplifting mix of soul, funk and forward motion.",
    artwork: "tower",
    listenUrl: null,
    supportUrl: null,
  },
  {
    id: "half-light",
    title: "Half Light",
    description: "Intimate, raw and made in the in-between.",
    artwork: "guitar",
    listenUrl: null,
    supportUrl: null,
  },
  {
    id: "through-the-static",
    title: "Through The Static",
    description: "Textures, tension and release for wandering minds.",
    artwork: "waves",
    listenUrl: null,
    supportUrl: null,
  },
];

export const liveGigs: LiveGig[] = [];

export const lessonFeatures = [
  {
    title: "Live Sessions",
    copy: "One-to-one online or in-person lessons shaped around your goals.",
  },
  {
    title: "Style & Theory",
    copy: "Blues, jazz, funk, neo-soul, songwriting and the theory inside the sound.",
  },
  {
    title: "All Levels Welcome",
    copy: "From your first chord to advanced improvisation, we build from where you are.",
  },
];

export const lessonFaqs = [
  {
    question: "Do I need to read music?",
    answer:
      "No. Lessons can use notation, chord charts, recordings or learning by ear depending on how you learn best.",
  },
  {
    question: "Are online lessons available?",
    answer:
      "Yes. Online sessions are structured for clear demonstrations, live feedback and practical material to work on between lessons.",
  },
  {
    question: "Can lessons focus on songwriting?",
    answer:
      "Yes. Harmony, arrangement, lyric support and developing a distinct musical voice can all form part of the session.",
  },
  {
    question: "What should I bring?",
    answer:
      "Your instrument, a way to take notes and one or two musical goals. Everything else can be built together.",
  },
];

export const roles = [
  {
    title: "Songwriter",
    copy: "Honest songs built around melody, rhythm and emotional detail.",
  },
  {
    title: "Composer",
    copy: "Music shaped for atmosphere, narrative and movement.",
  },
  {
    title: "Producer",
    copy: "Arrangements and recordings with character left intact.",
  },
  {
    title: "Multi-Instrumentalist",
    copy: "Guitar, bass and the wider musical language around them.",
  },
];

export const videos: Video[] = [
  {
    id: "no-time-for-love",
    title: "No Time For Love",
    note: "Official Music Video",
    imageSlot: "hat",
    url: "https://www.youtube.com/watch?v=WmWasQXIhi0",
    thumbnailUrl: "https://i.ytimg.com/vi/WmWasQXIhi0/hqdefault.jpg",
  },
  {
    id: "studio-clip",
    title: "Studio Clip",
    note: "Behind the song",
    imageSlot: "standing",
    url: null,
  },
  {
    id: "lesson-preview",
    title: "Lesson Preview",
    note: "Teaching",
    imageSlot: "live",
    url: null,
  },
  {
    id: "in-the-room",
    title: "In The Room",
    note: "Improvisation",
    imageSlot: "hat",
    url: null,
  },
];

export const products: Product[] = [
  {
    id: "limited-vinyl",
    name: "Limited Edition Vinyl",
    category: "Music",
    categorySlug: "music",
    note: "A numbered physical pressing with artwork insert.",
    description:
      "A small-run physical release built around numbered stock, tactile artwork and a collector feel.",
    prices: { GBP: 32, EUR: 38, USD: 42 },
    status: "Coming soon",
    saleMode: "unavailable",
    artwork: "vinyl",
  },
  {
    id: "guitar-notes",
    name: "Guitar Notes Vol. 01",
    category: "Education",
    categorySlug: "education",
    note: "Exercises, chord language and creative prompts from Luca's lessons.",
    description:
      "A printed workbook for players who want Luca's lesson language in a practical format: voicings, rhythm ideas, prompts and short studies.",
    prices: { GBP: 18, EUR: 22, USD: 24 },
    status: "Coming soon",
    saleMode: "unavailable",
    artwork: "book",
  },
  {
    id: "artist-shirt",
    name: "LP Artist Shirt",
    category: "Merchandise",
    categorySlug: "merchandise",
    note: "Heavyweight black cotton with a distressed two-colour print.",
    description:
      "A merch concept using Luca's stripped-back poster language on a heavyweight black shirt with a worn-in stage-ready finish.",
    prices: { GBP: 26, EUR: 31, USD: 34 },
    status: "Coming soon",
    artwork: "shirt",
    saleMode: "unavailable",
  },
  {
    id: "remote-session",
    name: "Remote Guitar Session",
    category: "Studio",
    categorySlug: "studio",
    note: "A custom recorded guitar part shaped around your song.",
    description:
      "Remote guitar parts, arrangement ideas or texture passes recorded for your track and shaped through direct conversation.",
    prices: { GBP: 95, EUR: 112, USD: 125 },
    status: "Enquiries welcome",
    artwork: "session",
    saleMode: "enquiry",
  },
];

export const socialLinks: ExternalDestination[] = [
  { label: "Instagram", href: "https://www.instagram.com/lucapisanumusic/" },
  { label: "YouTube", href: "https://www.youtube.com/@lucapisanumusic" },
  { label: "Spotify", href: null },
  { label: "Apple Music", href: "https://music.apple.com/gb/artist/luca-pisanu/497386712" },
  { label: "Tidal", href: "https://tidal.com/artist/19084237" },
  { label: "Facebook", href: null },
];

export const inquiryTypes: { value: InquiryType; label: string }[] = [
  { value: "music", label: "Music / Booking" },
  { value: "lessons", label: "Lessons" },
  { value: "collaboration", label: "Collaboration" },
  { value: "press", label: "Press" },
  { value: "other", label: "Other" },
];

export const contactEmail = "lucapisanumusic@gmail.com";
