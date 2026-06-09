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
  artwork: "portrait" | "tower" | "guitar" | "waves";
  listenUrl: string | null;
  supportUrl: string | null;
};

export type Video = {
  id: string;
  title: string;
  note: string;
  imageSlot: "hat" | "standing" | "live";
  url: string | null;
  thumbnailUrl?: string | null;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  note: string;
  price: string | null;
  artwork: "vinyl" | "book" | "shirt" | "session";
  url: string | null;
};

export type InquiryType =
  | "music"
  | "lessons"
  | "collaboration"
  | "press"
  | "other";

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Music", href: "/music" },
  { label: "Lessons", href: "/lessons" },
  { label: "About", href: "/about" },
  { label: "Videos", href: "/videos" },
  { label: "Shop", href: "/shop" },
  { label: "Contact", href: "/contact" },
];

export const heroLines = [
  "Singer & Songwriter",
  "Composer & Producer",
  "Multi-Instrumentalist",
  "Independent Artist",
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
    note: "A numbered physical pressing with artwork insert.",
    price: null,
    artwork: "vinyl",
    url: null,
  },
  {
    id: "guitar-notes",
    name: "Guitar Notes Vol. 01",
    category: "Education",
    note: "Exercises, chord language and creative prompts from Luca’s lessons.",
    price: null,
    artwork: "book",
    url: null,
  },
  {
    id: "artist-shirt",
    name: "LP Artist Shirt",
    category: "Merchandise",
    note: "Heavyweight black cotton with a distressed two-colour print.",
    price: null,
    artwork: "shirt",
    url: null,
  },
  {
    id: "remote-session",
    name: "Remote Guitar Session",
    category: "Studio",
    note: "A custom recorded guitar part shaped around your song.",
    price: null,
    artwork: "session",
    url: null,
  },
];

export const socialLinks: ExternalDestination[] = [
  { label: "Instagram", href: null },
  { label: "YouTube", href: null },
  { label: "Spotify", href: null },
  { label: "Apple Music", href: null },
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
