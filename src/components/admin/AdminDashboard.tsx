"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { countryOptions } from "@/data/countries";
import type { HomeCrop, HomePageMedia, HomePagePicture } from "@/lib/home-page-data";
import type { EpkContent } from "@/lib/epk-data";

type ApiEnvelope = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

type AdminComment = {
  id: string;
  screenName: string;
  body: string;
  email: string;
  emailNormalized: string;
  ipHash: string;
  isVisible: boolean;
  createdAt: string;
};

type MusicRelease = {
  id: string;
  title: string;
  description: string;
  releaseType: "ALBUM" | "EP" | "SINGLE";
  artwork: "portrait" | "tower" | "guitar" | "waves";
  artworkId: string | null;
  coverArtUrl: string | null;
  audioUrl: string | null;
  listenUrl: string | null;
  supportUrl: string | null;
  purchaseProductId: string;
  purchasePriceGbp: number;
  purchasePriceEur: number;
  purchasePriceUsd: number;
  isForSale: boolean;
  digitalAssets: ShopDigitalAsset[];
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  tidalUrl: string | null;
  youtubeUrl: string | null;
  soundcloudUrl: string | null;
  bandcampUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
};

type MusicArtwork = {
  id: string;
  title: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
};

type WatchVideo = {
  id: string;
  title: string;
  note: string;
  youtubeUrl: string;
  sortOrder: number;
  isVisible: boolean;
};

type LiveGig = {
  id: string;
  event: string;
  venue: string;
  location: string;
  startsDate: string;
  startsTime: string;
  lineupType: "SOLO" | "DUO" | "TRIO" | "QUARTET" | "FULL_BAND" | "OTHER" | null;
  lineupOther: string | null;
  ticketUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
};

type AboutContent = {
  eyebrow: string;
  heading: string;
  highlight: string;
  bodyText: string;
};

type ShopProduct = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  note: string;
  description: string;
  priceGbp: number;
  priceEur: number;
  priceUsd: number;
  status: string;
  saleMode: "purchase" | "enquiry" | "unavailable";
  productType: "physical" | "digital";
  videoDeliveryType: "upload" | "link" | null;
  videoExternalUrl: string | null;
  videoAsset: ShopVideoAsset | null;
  trackInventory: boolean;
  stockQuantity: number;
  artwork: "vinyl" | "book" | "shirt" | "session";
  artworkId: string | null;
  frontArtworkUrl: string | null;
  backArtworkUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  variants: ShopVariant[];
  shippingRates: ShopShippingRate[];
  digitalAssets: ShopDigitalAsset[];
};

type ShopVideoAsset = {
  id: string; productId: string; originalFilename: string;
  contentType: string; sizeBytes: number; createdAt: string; updatedAt: string;
};

type ShopDigitalAsset = {
  id: string; productId: string; format: "mp3" | "wav";
  originalFilename: string; contentType: string; sizeBytes: number;
  createdAt: string; updatedAt: string;
};

type ShopVariant = {
  id: string;
  productId: string;
  label: string;
  sku: string;
  options: Record<string, string>;
  stockQuantity: number;
  isAvailable: boolean;
  sortOrder: number;
};

type ShopShippingRate = {
  id: string;
  productId: string;
  countryCode: string;
  feeGbp: number;
  feeEur: number;
  feeUsd: number;
};

type ShopOrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_amount_minor: number;
  shipping_amount_minor: number;
  line_total_minor: number;
};

type ShopOrder = {
  id: string;
  order_number: string;
  status: string;
  fulfillment_status: string;
  currency: "GBP" | "EUR" | "USD";
  item_total_minor: number;
  shipping_total_minor: number;
  total_minor: number;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string;
  customer_message: string | null;
  address_line_1: string;
  address_line_2: string | null;
  address_city: string;
  address_region: string | null;
  address_postal_code: string;
  address_country_code: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  items: ShopOrderItem[];
};

type ShopArtwork = {
  id: string;
  title: string;
  frontUrl: string;
  backUrl: string | null;
  altText: string | null;
  sortOrder: number;
};

type AdminData = {
  comments: AdminComment[];
  music: MusicRelease[];
  musicArtworks: MusicArtwork[];
  videos: WatchVideo[];
  homeMedia: HomePageMedia;
  gigs: LiveGig[];
  about: AboutContent;
  epk: EpkContent;
  products: ShopProduct[];
  shopArtworks: ShopArtwork[];
  orders: ShopOrder[];
};

type AdminAccount = {
  id: string;
  email: string;
  role: "owner" | "admin";
  active: boolean;
  passwordSet: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminAudit = {
  id: string;
  actorEmail: string;
  targetEmail: string;
  action: string;
  createdAt: string;
};

type SectionId =
  | "comments"
  | "music"
  | "videos"
  | "gigs"
  | "about"
  | "epk"
  | "shop"
  | "orders"
  | "admins"
  | "account";
type Notice = { tone: "neutral" | "success" | "error"; text: string };

const maxDigitalAudioBytes = 95 * 1024 * 1024;

const endpoints = {
  about: "/api/admin/about",
  epk: "/api/admin/epk",
  epkAssets: "/api/admin/epk/assets",
  epkGallery: "/api/admin/epk/gallery",
  comments: "/api/admin/comments",
  homePage: "/api/admin/home-page",
  gigs: "/api/admin/live-gigs",
  musicArtwork: "/api/admin/music/artwork",
  music: "/api/admin/music/releases",
  shopArtwork: "/api/admin/shop/artwork",
  products: "/api/admin/shop/products",
  orders: "/api/admin/shop/orders",
  admins: "/api/admin/accounts",
  shippingRates: "/api/admin/shop/shipping-rates",
  digitalAssets: "/api/admin/shop/digital-assets",
  videoAssets: "/api/admin/shop/video-assets",
  variants: "/api/admin/shop/variants",
  videos: "/api/admin/watch-videos",
} as const;

const emptyAbout: AboutContent = {
  eyebrow: "",
  heading: "",
  highlight: "",
  bodyText: "",
};

const emptyEpk: EpkContent = {
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  positioningLine: "",
  snapshotHeading: "",
  snapshotBody: [],
  shortBio: "",
  fullBio: "",
  biographyQuote: "",
  musicHeading: "",
  musicIntro: "",
  riderHeading: "Trio stage plan.",
  riderInputs: "CH 1-N: venue-selected multi-mic drum package. CH N+1: guitar amp mic (SM57 or equivalent). CH N+2: bass amp mic (SM57 or equivalent). CH N+3: Luca lead vocal (SM58 or equivalent). CH N+4: bass backing vocal (SM58 or equivalent). CH N+5: drummer backing vocal (SM58 or equivalent). All microphone lines use balanced XLR.",
  riderRequirements: "Three boom vocal stands; suitable drum and amp mic stands/clips; three independent wedge mixes; stage box with the required inputs and three returns; four clean 230V AC drops at drums, guitar amp, guitar pedalboard, and the combined bass backline/pedalboard zone; safe cable runs. Guitar and bass use 1/4-inch TS instrument/pedal/amp connections. Active wedges use XLR returns; passive wedges use venue amplification and NL4.",
  riderAdvance: "Audience view: drums left, Luca centre, bass right. Mix 1 drums: lead vocal, drummer backing vocal, bass and guitar, with kick as required. Mix 2 Luca: lead vocal prominent, guitar, both backing vocals, with bass/kick as required. Mix 3 bass: bass backing vocal and lead vocal prominent, bass, guitar and kick as required. Final levels and the drum microphone package are agreed at soundcheck.",
  contactHeading: "",
  contactBody: "",
  contactEmail: "",
  websiteUrl: "",
  instagramUrl: "",
  photoUsageNote: "",
  heroImageUrl: "/luca-guitar-live.png",
  portraitImageUrl: "/luca-standing-smiling.png",
  pdfDownloadUrl: "/LUCA-PISANU-EPK-REVISED-JULY-2026.pdf",
  pdfOriginalFilename: "LUCA-PISANU-EPK-REVISED-JULY-2026.pdf",
  highlights: [],
  links: [],
  quotes: [],
  gallery: [],
  selectedMusicIds: [],
};

const emptyHomeMedia: HomePageMedia = {
  banner: {
    imageUrl: "/luca-guitar-live.png",
    desktop: { x: 66, y: 50, zoom: 1 },
    mobile: { x: 48, y: 50, zoom: 1 },
  },
  connect: {
    imageUrl: "/luca-standing-smiling-cutout.png",
    desktop: { x: 50, y: 15, zoom: 1 },
    mobile: { x: 50, y: 15, zoom: 1 },
  },
};

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "comments", label: "Comments" },
  { id: "music", label: "Music" },
  { id: "videos", label: "Home Page" },
  { id: "gigs", label: "Gigs" },
  { id: "about", label: "About" },
  { id: "epk", label: "EPK" },
  { id: "shop", label: "Shop" },
  { id: "orders", label: "Orders" },
  { id: "admins", label: "Administrators" },
  { id: "account", label: "Password" },
];

function emptyData(): AdminData {
  return {
    comments: [],
    music: [],
    musicArtworks: [],
    videos: [],
    homeMedia: emptyHomeMedia,
    gigs: [],
    about: emptyAbout,
    epk: emptyEpk,
    products: [],
    shopArtworks: [],
    orders: [],
  };
}

async function adminFetch<T>(
  csrfToken: string,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("x-csrf-token", csrfToken);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
  const responseText = await response.text();
  let json: (ApiEnvelope & T) | null = null;
  if (responseText) {
    try {
      json = JSON.parse(responseText) as ApiEnvelope & T;
    } catch {
      // Proxies and hosting platforms can return plain text or HTML before a
      // request reaches a route handler. Preserve the HTTP error below.
    }
  }

  if (!response.ok || !json?.ok) {
    const fallbackMessage = response.status === 413
      ? "The upload is too large. Choose an audio file smaller than 95 MB."
      : `Request failed (${response.status || "network error"}).`;
    const error = new Error(json?.message || fallbackMessage) as Error & {
      fieldErrors?: Record<string, string>;
      status?: number;
    };
    error.fieldErrors = json?.fieldErrors;
    error.status = response.status;
    throw error;
  }

  return json;
}

function nextSortOrder(items: Array<{ sortOrder: number }>) {
  return Math.max(0, ...items.map((item) => item.sortOrder)) + 10;
}

function ordered<T extends { sortOrder: number; id: string }>(items: T[]) {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
}

function isoDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function FieldError({ errors, name }: { errors: Record<string, string>; name: string }) {
  return errors[name] ? <span className="admin-field-error">{errors[name]}</span> : null;
}

function AdminButton({
  children,
  tone = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "danger";
}) {
  return (
    <button className={`admin-button admin-button--${tone}`} type="button" {...props}>
      {children}
    </button>
  );
}

function AdminDialog({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="admin-modal" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="admin-modal-title"
        aria-modal="true"
        className="admin-modal__window"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="admin-modal__header">
          <h3 id="admin-modal-title">{title}</h3>
          <AdminButton aria-label="Close dialog" onClick={onClose}>
            Close
          </AdminButton>
        </div>
        {children}
      </section>
    </div>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span className={`admin-status ${visible ? "is-visible" : "is-hidden"}`}>
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("lucapisanumusic@gmail.com");
  const [adminRole, setAdminRole] = useState<"owner" | "admin">("admin");
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminAudit, setAdminAudit] = useState<AdminAudit[]>([]);
  const [emailInput, setEmailInput] = useState("lucapisanumusic@gmail.com");
  const [passwordInput, setPasswordInput] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("comments");
  const [data, setData] = useState<AdminData>(emptyData);
  const [notice, setNotice] = useState<Notice>({
    tone: "neutral",
    text: "Sign in to manage the website.",
  });
  const [loading, setLoading] = useState(false);

  async function loadAll(nextToken = token) {
    setLoading(true);
    try {
      const [
        comments,
        music,
        musicArtworks,
        videos,
        homePage,
        gigs,
        about,
        epk,
        products,
        shopArtworks,
        orders,
      ] = await Promise.all([
        adminFetch<{ comments: AdminComment[] }>(nextToken, endpoints.comments),
        adminFetch<{ releases: MusicRelease[] }>(nextToken, endpoints.music),
        adminFetch<{ artworks: MusicArtwork[] }>(nextToken, endpoints.musicArtwork),
        adminFetch<{ videos: WatchVideo[] }>(nextToken, endpoints.videos),
        adminFetch<{ media: HomePageMedia }>(nextToken, endpoints.homePage),
        adminFetch<{ gigs: LiveGig[] }>(nextToken, endpoints.gigs),
        adminFetch<{ about: AboutContent }>(nextToken, endpoints.about),
        adminFetch<{ epk: EpkContent }>(nextToken, endpoints.epk),
        adminFetch<{ products: ShopProduct[] }>(nextToken, endpoints.products),
        adminFetch<{ artworks: ShopArtwork[] }>(nextToken, endpoints.shopArtwork),
        adminFetch<{ orders: ShopOrder[] }>(nextToken, endpoints.orders),
      ]);

      setData({
        comments: comments.comments,
        music: music.releases,
        musicArtworks: musicArtworks.artworks,
        videos: videos.videos,
        homeMedia: homePage.media,
        gigs: gigs.gigs,
        about: about.about,
        epk: epk.epk,
        products: products.products,
        shopArtworks: shopArtworks.artworks,
        orders: orders.orders,
      });
      setNotice({ tone: "success", text: "Admin content loaded." });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        setToken("");
      }
      setNotice({
        tone: "error",
        text: (error as Error).message || "Could not load admin content.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminAccounts(nextToken = token) {
    if (adminRole !== "owner") return;
    const result = await adminFetch<{ accounts: AdminAccount[]; audit: AdminAudit[] }>(
      nextToken,
      endpoints.admins,
    );
    setAdminAccounts(result.accounts);
    setAdminAudit(result.audit);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok?: boolean;
          csrfToken?: string;
          email?: string;
          role?: "owner" | "admin";
        };
        if (!response.ok || !result.ok || !result.csrfToken) return;
        setToken(result.csrfToken);
        setAdminRole(result.role === "owner" ? "owner" : "admin");
        if (result.email) {
          setAdminEmail(result.email);
          setEmailInput(result.email);
        }
        await loadAll(result.csrfToken);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setNotice({ tone: "error", text: "Admin is temporarily unavailable." });
        }
      })
      .finally(() => setCheckingSession(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json()) as ApiEnvelope & {
        csrfToken?: string;
        email?: string;
        role?: "owner" | "admin";
      };
      if (!response.ok || !result.ok || !result.csrfToken) {
        throw new Error(result.message || "Login failed.");
      }
      setToken(result.csrfToken);
      setAdminRole(result.role === "owner" ? "owner" : "admin");
      setAdminEmail(result.email || emailInput);
      setPasswordInput("");
      await loadAll(result.csrfToken);
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function forgotPassword() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json()) as ApiEnvelope;
      setNotice({
        tone: response.ok ? "success" : "error",
        text: result.message || "Password reset request completed.",
      });
    } catch {
      setNotice({ tone: "error", text: "Could not request a password reset." });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await adminFetch(token, "/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Clear local authenticated state even if the server session has expired.
    }
    setToken("");
    setPasswordInput("");
    setData(emptyData());
    setNotice({ tone: "neutral", text: "Logged out." });
  }

  if (checkingSession) {
    return (
      <section className="admin-shell admin-shell--login" aria-label="Checking admin session">
        <div className="admin-login-card"><p>Checking secure session…</p></div>
      </section>
    );
  }

  if (!token) {
    return (
      <section className="admin-shell admin-shell--login" aria-label="Login">
        <div className="admin-login-card">
          <header className="admin-login-card__header">
            <span>Luca 4</span>
            <h1>Login</h1>
          </header>
          <p className={`admin-notice admin-notice--${notice.tone}`} role="status">
            {notice.text}
          </p>
          <form className="admin-login" onSubmit={handleLogin}>
            <label>
              Email
              <input
                autoComplete="username"
                autoFocus
                onChange={(event) => setEmailInput(event.target.value)}
                required
                type="email"
                value={emailInput}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                onChange={(event) => setPasswordInput(event.target.value)}
                required
                type="password"
                value={passwordInput}
              />
            </label>
            <button className="admin-button admin-button--primary" disabled={loading} type="submit">
              {loading ? "Working…" : "Log in"}
            </button>
            <button className="admin-button admin-button--secondary" disabled={loading} onClick={() => void forgotPassword()} type="button">
              Set or reset password
            </button>
          </form>
        </div>
      </section>
    );
  }

  const counts: Record<SectionId, number | string> = {
    account: "",
    admins: adminAccounts.length,
    about: data.about.heading ? 1 : 0,
    epk: data.epk.gallery.length,
    comments: data.comments.length,
    gigs: data.gigs.length,
    music: data.music.length,
    orders: data.orders.length,
    shop: data.products.length,
    videos: "",
  };

  return (
    <section className="admin-shell" aria-label="Website admin">
      <aside className="admin-nav" aria-label="Admin sections">
        <div className="admin-nav__brand">
          <span>Admin</span>
          <strong>Luca 4</strong>
        </div>
        {sections.filter((section) => section.id !== "admins" || adminRole === "owner").map((section) => (
          <button
            aria-current={activeSection === section.id ? "page" : undefined}
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              if (section.id === "admins") {
                void loadAdminAccounts().catch((error) => {
                  setNotice({ tone: "error", text: (error as Error).message });
                });
              }
            }}
            type="button"
          >
            <span>{section.label}</span>
            <small>{counts[section.id]}</small>
          </button>
        ))}
      </aside>

      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <h1>Website Content</h1>
            <p>Manage public content, ordering, and visibility.</p>
          </div>
          <div className="admin-header__actions">
            <AdminButton onClick={() => void loadAll()} disabled={loading}>
              {loading ? "Refreshing" : "Refresh"}
            </AdminButton>
            <span>{adminEmail}</span>
            <AdminButton onClick={() => void logout()}>Logout</AdminButton>
          </div>
        </header>

        <p className={`admin-notice admin-notice--${notice.tone}`} role="status">
          {notice.text}
        </p>

        {activeSection === "comments" ? (
          <CommentsSection
            comments={data.comments}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "music" ? (
          <MusicSection
            artworks={data.musicArtworks}
            releases={data.music}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "videos" ? (
          <HomePageSection
            media={data.homeMedia}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
            videos={data.videos}
          />
        ) : null}
        {activeSection === "gigs" ? (
          <GigsSection
            gigs={data.gigs}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "about" ? (
          <AboutSection
            about={data.about}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "epk" ? (
          <EpkSection
            epk={data.epk}
            key={`${data.epk.heroImageUrl}:${data.epk.portraitImageUrl}:${data.epk.pdfDownloadUrl}:${data.epk.highlights.map((item) => `${item.id}-${item.sortOrder}-${item.body}`).join(",")}:${data.epk.gallery.map((item) => item.id).join(",")}:${data.epk.selectedMusicIds.join(",")}:${data.music.map((item) => `${item.id}-${item.isVisible}`).join(",")}`}
            music={data.music}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "shop" ? (
          <ShopSection
            artworks={data.shopArtworks}
            products={data.products}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "orders" ? (
          <OrdersSection
            orders={data.orders}
            refresh={loadAll}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "account" ? (
          <AccountSection
            onPasswordChanged={() => {
              setToken("");
              setData(emptyData());
              setNotice({ tone: "success", text: "Password changed. Log in again." });
            }}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
        {activeSection === "admins" && adminRole === "owner" ? (
          <AdministratorsSection
            accounts={adminAccounts}
            audit={adminAudit}
            currentUserId={adminAccounts.find((account) => account.email === adminEmail)?.id ?? ""}
            refresh={loadAdminAccounts}
            setNotice={setNotice}
            token={token}
          />
        ) : null}
      </div>
    </section>
  );
}

function CommentsSection({
  comments,
  refresh,
  setNotice,
  token,
}: {
  comments: AdminComment[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  async function setVisibility(comment: AdminComment, isVisible: boolean) {
    await adminFetch(token, endpoints.comments, {
      body: JSON.stringify({ id: comment.id, isVisible }),
      method: "PATCH",
    });
    setNotice({ tone: "success", text: "Comment visibility updated." });
    await refresh();
  }

  async function deleteComment(comment: AdminComment) {
    if (!window.confirm(`Delete comment from ${comment.screenName}?`)) return;
    await adminFetch(token, endpoints.comments, {
      body: JSON.stringify({ id: comment.id }),
      method: "DELETE",
    });
    setNotice({ tone: "success", text: "Comment deleted." });
    await refresh();
  }

  return (
    <section className="admin-section">
      <div className="admin-section__heading">
        <h2>Comments</h2>
        <p>Moderate homepage comments. Hidden comments stay stored.</p>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Comment</th>
              <th>Email</th>
              <th>IP hash</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {comments.map((comment) => (
              <tr key={comment.id}>
                <td>
                  <strong>{comment.screenName}</strong>
                  <small>{comment.id}</small>
                </td>
                <td className="admin-table__wide">{comment.body}</td>
                <td>
                  <span>{comment.email}</span>
                  <small>{comment.emailNormalized}</small>
                </td>
                <td>
                  <code>{comment.ipHash}</code>
                </td>
                <td>
                  <VisibilityBadge visible={comment.isVisible} />
                </td>
                <td>{isoDateTime(comment.createdAt)}</td>
                <td>
                  <div className="admin-row-actions">
                    <AdminButton
                      onClick={() => void setVisibility(comment, !comment.isVisible)}
                    >
                      {comment.isVisible ? "Hide" : "Show"}
                    </AdminButton>
                    <AdminButton tone="danger" onClick={() => void deleteComment(comment)}>
                      Delete
                    </AdminButton>
                  </div>
                </td>
              </tr>
            ))}
            {!comments.length ? (
              <tr>
                <td colSpan={7}>No comments yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MusicSection({
  artworks,
  releases,
  refresh,
  setNotice,
  token,
}: {
  artworks: MusicArtwork[];
  releases: MusicRelease[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [editing, setEditing] = useState<MusicRelease | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const sorted = ordered(releases);

  function newRelease(releaseType: MusicRelease["releaseType"] = "SINGLE"): MusicRelease {
    return {
      id: "",
      title: "",
      description: "",
      releaseType,
      artwork: "portrait",
      artworkId: null,
      coverArtUrl: null,
      audioUrl: null,
      listenUrl: "",
      supportUrl: "",
      purchaseProductId: "",
      purchasePriceGbp: 1.99,
      purchasePriceEur: 1.99,
      purchasePriceUsd: 1.99,
      isForSale: false,
      digitalAssets: [],
      spotifyUrl: "",
      appleMusicUrl: "",
      tidalUrl: "",
      youtubeUrl: "",
      soundcloudUrl: "",
      bandcampUrl: "",
      sortOrder: nextSortOrder(releases),
      isVisible: false,
    };
  }

  async function saveRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setErrors({});
    setSaving(true);
    setSaveStatus("Saving release details…");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const releaseId = String(formData.get("id") || formData.get("title") || "").trim();
    const releaseTitle = String(formData.get("title") || "").trim();
    const requestedForSale = Boolean(formData.get("isForSale"));
    const purchasedMp3 = formData.get("purchasedMp3");
    const purchasedWav = formData.get("purchasedWav");
    const paidFiles = [purchasedMp3, purchasedWav].filter(
      (file): file is File => file instanceof File && file.size > 0,
    );

    const oversizedFile = paidFiles.find((file) => file.size > maxDigitalAudioBytes);
    if (oversizedFile) {
      const message = `${oversizedFile.name} is ${(oversizedFile.size / 1024 / 1024).toFixed(1)} MB. Purchased audio files must be smaller than 95 MB.`;
      setSaveStatus(message);
      setNotice({ tone: "error", text: message });
      setSaving(false);
      return;
    }
    let artworkId = String(formData.get("artworkId") || "").trim();
    formData.set("isVisible", formData.get("isVisible") ? "true" : "false");
    formData.set("isForSale", requestedForSale ? "true" : "false");
    formData.delete("purchasedMp3");
    formData.delete("purchasedWav");

    try {
      const artworkImage = formData.get("artworkImage");
      const hasArtworkImage = artworkImage instanceof File && artworkImage.size > 0;

      if (hasArtworkImage) {
        const nextArtworkId = artworkId || releaseId || releaseTitle;
        const artworkFormData = new FormData();
        artworkFormData.set("id", nextArtworkId);
        artworkFormData.set("title", releaseTitle || nextArtworkId);
        artworkFormData.set("altText", releaseTitle);
        artworkFormData.set("sortOrder", String(formData.get("sortOrder") || nextSortOrder(artworks)));
        artworkFormData.set("image", artworkImage);

        const artworkResponse = await adminFetch<{ artwork: MusicArtwork | null }>(
          token,
          endpoints.musicArtwork,
          {
            body: artworkFormData,
            method: "POST",
          },
        );
        artworkId = artworkResponse.artwork?.id ?? nextArtworkId;
      }

      formData.set("artworkId", artworkId);
      formData.delete("artworkImage");

      if (paidFiles.length) formData.set("isForSale", "false");
      let saved = await adminFetch<{ release: MusicRelease }>(token, endpoints.music, {
        body: formData,
        method: "POST",
      });
      formData.delete("coverArt");
      formData.delete("audio");
      for (const [format, file] of [["mp3", purchasedMp3], ["wav", purchasedWav]] as const) {
        if (!(file instanceof File) || !file.size) continue;
        setSaveStatus(`Uploading purchased ${format.toUpperCase()}…`);
        await adminFetch(
          token,
          `${endpoints.digitalAssets}?productId=${encodeURIComponent(saved.release.purchaseProductId)}&format=${format}`,
          {
            method: "POST",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "x-file-name": file.name,
            },
            body: file,
          },
        );
      }
      if (paidFiles.length && requestedForSale) {
        setSaveStatus("Enabling PayPal checkout…");
        formData.set("isForSale", "true");
        saved = await adminFetch<{ release: MusicRelease }>(token, endpoints.music, {
          body: formData,
          method: "POST",
        });
      }
      form.reset();
      setEditing(null);
      setSaveStatus("");
      setNotice({ tone: "success", text: "Music release saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      const message = (error as Error).message;
      setSaveStatus(message);
      setNotice({ tone: "error", text: message });
    } finally {
      setSaving(false);
    }
  }

  async function patchRelease(action: "visibility" | "reorder", body: Record<string, unknown>) {
    await adminFetch(token, endpoints.music, {
      body: JSON.stringify({ action, ...body }),
      method: "PATCH",
    });
    await refresh();
  }

  async function deleteRelease(release: MusicRelease) {
    if (!window.confirm(`Delete ${release.title}?`)) return;
    await adminFetch(token, endpoints.music, {
      body: JSON.stringify({ id: release.id }),
      method: "DELETE",
    });
    setNotice({ tone: "success", text: "Music release deleted." });
    await refresh();
  }

  async function deletePurchasedFile(asset: ShopDigitalAsset) {
    if (!window.confirm(`Remove ${asset.originalFilename}?`)) return;
    try {
      await adminFetch(token, endpoints.digitalAssets, {
        body: JSON.stringify({ id: asset.id }),
        method: "DELETE",
      });
      setEditing((current) => current ? {
        ...current,
        isForSale: false,
        digitalAssets: current.digitalAssets.filter((item) => item.id !== asset.id),
      } : current);
      setNotice({ tone: "success", text: `${asset.format.toUpperCase()} removed; purchasing is now unavailable.` });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <section className="admin-section">
      <div>
        <div className="admin-section__heading">
          <h2>Music</h2>
          <p>Lowest order becomes the featured release.</p>
          <AdminButton tone="primary" onClick={() => setEditing(newRelease())}>
            Add Release
          </AdminButton>
        </div>
        <div className="admin-music-categories">
          {(["ALBUM", "EP", "SINGLE"] as const).map((releaseType) => {
            const items = sorted.filter((release) => release.releaseType === releaseType);
            const title = releaseType === "ALBUM" ? "Albums" : releaseType === "EP" ? "EPs" : "Singles";
            return <section className="admin-music-category" key={releaseType}>
              <div className="admin-music-category__heading"><h3>{title}</h3><AdminButton onClick={() => setEditing(newRelease(releaseType))}>Add {releaseType === "EP" ? "EP" : releaseType.toLowerCase()}</AdminButton></div>
              <OrderedTable
                items={items}
                empty={`No ${title.toLowerCase()} found.`}
                endpoint={endpoints.music}
                getTitle={(release) => release.title}
                refresh={refresh}
                renderMeta={(release) => `${release.isVisible ? "Available" : "Coming soon"} · ${release.description}`}
                setNotice={setNotice}
                token={token}
                onDelete={deleteRelease}
                onEdit={setEditing}
                onVisibility={(release) => patchRelease("visibility", { id: release.id, isVisible: !release.isVisible })}
              />
            </section>;
          })}
        </div>
      </div>

      {editing ? (
        <AdminDialog
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit Release" : "Add Release"}
        >
        <form className="admin-form" onSubmit={saveRelease}>
          <label>
            ID
            <input name="id" defaultValue={editing.id} placeholder="auto-from-title" />
            <FieldError errors={errors} name="id" />
          </label>
          <label>
            Title
            <input name="title" defaultValue={editing.title} required />
            <FieldError errors={errors} name="title" />
          </label>
          <label>
            Description
            <textarea name="description" defaultValue={editing.description} rows={4} required />
            <FieldError errors={errors} name="description" />
          </label>
          <label>
            Category
            <select name="releaseType" defaultValue={editing.releaseType}>
              <option value="ALBUM">Album</option>
              <option value="EP">EP</option>
              <option value="SINGLE">Single</option>
            </select>
          </label>
          <label>
            Upload artwork image
            <input name="artworkImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
            {editing.coverArtUrl ? <small>Current artwork is stored.</small> : null}
            <FieldError errors={errors} name="image" />
          </label>
          <input name="artwork" type="hidden" value={editing.artwork} />
          <input name="artworkId" type="hidden" value={editing.artworkId ?? ""} />
          <div className="admin-form__grid">
            <label>
              Sort order
              <input name="sortOrder" type="number" defaultValue={editing.sortOrder} />
            </label>
            <label className="admin-check">
              <input name="isVisible" type="checkbox" defaultChecked={editing.isVisible} />
              Available on music page
            </label>
          </div>
          <label>
            Audio
            <input name="audio" type="file" accept="audio/*" />
            {editing.audioUrl ? <small>Current audio is stored.</small> : null}
            <small>This is the public streaming preview.</small>
          </label>
          <div className="admin-commerce-editor">
            <section>
              <h4>PayPal digital purchase</h4>
              <p>The paid MP3 and WAV stay private. One purchase unlocks both formats immediately and by email.</p>
              <div className="admin-form__grid">
                <label>
                  Minimum (GBP)
                  <input
                    name="purchasePriceGbp"
                    type="number"
                    defaultValue={editing.purchasePriceGbp}
                    min="0"
                    step="0.01"
                  />
                  <FieldError errors={errors} name="purchasePriceGbp" />
                </label>
                <label>
                  Minimum (EUR)
                  <input name="purchasePriceEur" type="number" min="0" max="100" step="0.01" defaultValue={editing.purchasePriceEur} />
                  <FieldError errors={errors} name="purchasePriceEur" />
                </label>
                <label>
                  Minimum (USD)
                  <input name="purchasePriceUsd" type="number" min="0" max="100" step="0.01" defaultValue={editing.purchasePriceUsd} />
                  <FieldError errors={errors} name="purchasePriceUsd" />
                </label>
                <label className="admin-check">
                  <input name="isForSale" type="checkbox" defaultChecked={editing.isForSale} />
                  Available to buy
                </label>
              </div>
              <FieldError errors={errors} name="isForSale" />
              {(["mp3", "wav"] as const).map((format) => {
                const asset = editing.digitalAssets.find((item) => item.format === format);
                return (
                  <label key={format}>
                    Purchased {format.toUpperCase()}
                    <input
                      name={format === "mp3" ? "purchasedMp3" : "purchasedWav"}
                      type="file"
                      accept={format === "mp3" ? "audio/mpeg,audio/mp3" : "audio/wav,audio/wave,audio/x-wav"}
                    />
                    {asset ? (
                      <span className="admin-actions">
                        <small>{asset.originalFilename} ({(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB)</small>
                        <AdminButton tone="danger" onClick={() => void deletePurchasedFile(asset)}>
                          Remove
                        </AdminButton>
                      </span>
                    ) : <small>No private {format.toUpperCase()} uploaded.</small>}
                  </label>
                );
              })}
            </section>
          </div>
          <UrlFields item={editing} errors={errors} />
          {saveStatus ? (
            <p
              className={`admin-notice admin-notice--${saving ? "neutral" : "error"}`}
              role={saving ? "status" : "alert"}
            >
              {saveStatus}
            </p>
          ) : null}
          <div className="admin-actions">
            <AdminButton disabled={saving} onClick={() => setEditing(null)}>Cancel</AdminButton>
            <button className="admin-button admin-button--primary" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save Release"}
            </button>
          </div>
        </form>
        </AdminDialog>
      ) : null}
    </section>
  );
}

function UrlFields({
  item,
  errors,
}: {
  item: Partial<MusicRelease>;
  errors: Record<string, string>;
}) {
  const fields: Array<[keyof MusicRelease, string]> = [
    ["spotifyUrl", "Spotify URL"],
    ["appleMusicUrl", "Apple Music URL"],
    ["tidalUrl", "Tidal URL"],
    ["youtubeUrl", "YouTube URL"],
    ["soundcloudUrl", "SoundCloud URL"],
    ["bandcampUrl", "Bandcamp URL"],
  ];

  return (
    <>
      {fields.map(([name, label]) => (
        <label key={String(name)}>
          {label}
          <input name={String(name)} defaultValue={(item[name] as string | null) ?? ""} />
          <FieldError errors={errors} name={String(name)} />
        </label>
      ))}
    </>
  );
}

function HomePageSection({
  media,
  videos,
  refresh,
  setNotice,
  token,
}: {
  media: HomePageMedia;
  videos: WatchVideo[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  return (
    <div className="admin-home-page">
      <WatchVideoSection
        refresh={refresh}
        setNotice={setNotice}
        token={token}
        videos={videos}
      />
      <HomePictureEditor
        key={`banner-${media.banner.imageUrl}`}
        kind="banner"
        picture={media.banner}
        refresh={refresh}
        setNotice={setNotice}
        token={token}
      />
      <HomePictureEditor
        key={`connect-${media.connect.imageUrl}`}
        kind="connect"
        picture={media.connect}
        refresh={refresh}
        setNotice={setNotice}
        token={token}
      />
    </div>
  );
}

function cropPreviewStyle(crop: HomeCrop): CSSProperties {
  return {
    objectFit: "cover",
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: `${crop.x}% ${crop.y}%`,
  };
}

function CropControls({
  crop,
  label,
  onChange,
}: {
  crop: HomeCrop;
  label: string;
  onChange: (crop: HomeCrop) => void;
}) {
  return (
    <fieldset className="admin-crop-controls">
      <legend>{label}</legend>
      <label>
        Horizontal position <output>{Math.round(crop.x)}%</output>
        <input
          aria-label={`${label} horizontal position`}
          max="100"
          min="0"
          onChange={(event) => onChange({ ...crop, x: Number(event.target.value) })}
          type="range"
          value={crop.x}
        />
      </label>
      <label>
        Vertical position <output>{Math.round(crop.y)}%</output>
        <input
          aria-label={`${label} vertical position`}
          max="100"
          min="0"
          onChange={(event) => onChange({ ...crop, y: Number(event.target.value) })}
          type="range"
          value={crop.y}
        />
      </label>
      <label>
        Zoom <output>{crop.zoom.toFixed(2)}×</output>
        <input
          aria-label={`${label} zoom`}
          max="2.5"
          min="1"
          onChange={(event) => onChange({ ...crop, zoom: Number(event.target.value) })}
          step="0.05"
          type="range"
          value={crop.zoom}
        />
      </label>
    </fieldset>
  );
}

function HomePictureEditor({
  kind,
  picture,
  refresh,
  setNotice,
  token,
}: {
  kind: "banner" | "connect";
  picture: HomePagePicture;
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [desktop, setDesktop] = useState<HomeCrop>(picture.desktop);
  const [mobile, setMobile] = useState<HomeCrop>(picture.mobile);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(picture.imageUrl);
  const [saving, setSaving] = useState(false);
  const title = kind === "banner" ? "Banner Picture" : "Let’s Connect Picture";
  const description = kind === "banner"
    ? "Upload the homepage hero image, then frame it separately for wide and narrow screens."
    : "Upload the portrait used inside the homepage Let’s Connect frame. The mobile crop is shown on phones.";

  useEffect(() => () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function chooseImage(file: File | null) {
    setImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : picture.imageUrl);
  }

  async function savePicture(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const body = new FormData();
    body.set("kind", kind);
    if (image) body.set("image", image);
    body.set("desktopX", String(desktop.x));
    body.set("desktopY", String(desktop.y));
    body.set("desktopZoom", String(desktop.zoom));
    body.set("mobileX", String(mobile.x));
    body.set("mobileY", String(mobile.y));
    body.set("mobileZoom", String(mobile.zoom));

    try {
      const result = await adminFetch<{ media: HomePageMedia }>(
        token,
        endpoints.homePage,
        { body, method: "POST" },
      );
      const savedPicture = result.media[kind];
      setImage(null);
      setPreviewUrl(savedPicture.imageUrl);
      setDesktop(savedPicture.desktop);
      setMobile(savedPicture.mobile);
      setNotice({ tone: "success", text: `${title} saved.` });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const frameClass = kind === "banner" ? "is-banner" : "is-connect";

  return (
    <section className="admin-section admin-picture-section">
      <div className="admin-section__heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <form className="admin-picture-editor" onSubmit={savePicture}>
        <label className="admin-picture-upload">
          Choose a new image
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(event) => chooseImage(event.target.files?.[0] ?? null)}
            type="file"
          />
          <small>JPEG, PNG, WebP or AVIF, up to 15 MB. The original is kept for future cropping.</small>
        </label>

        <div className="admin-crop-grid">
          <div className="admin-crop-column">
            <div className={`admin-crop-preview ${frameClass} is-desktop`}>
              <Image alt="Desktop crop preview" fill src={previewUrl} style={cropPreviewStyle(desktop)} unoptimized />
              <span>Desktop preview</span>
            </div>
            <CropControls crop={desktop} label="Desktop crop" onChange={setDesktop} />
          </div>
          <div className="admin-crop-column">
            <div className={`admin-crop-preview ${frameClass} is-mobile`}>
              <Image alt="Mobile crop preview" fill src={previewUrl} style={cropPreviewStyle(mobile)} unoptimized />
              <span>Mobile preview</span>
            </div>
            <CropControls crop={mobile} label="Mobile crop" onChange={setMobile} />
          </div>
        </div>

        <div className="admin-actions">
          <button className="admin-button admin-button--primary" disabled={saving} type="submit">
            {saving ? "Saving…" : `Save ${title}`}
          </button>
        </div>
      </form>
    </section>
  );
}

function WatchVideoSection({
  videos,
  refresh,
  setNotice,
  token,
}: {
  videos: WatchVideo[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [editing, setEditing] = useState<WatchVideo | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sorted = ordered(videos);

  function newVideo(): WatchVideo {
    return {
      id: "",
      title: "",
      note: "",
      youtubeUrl: "",
      sortOrder: nextSortOrder(videos),
      isVisible: true,
    };
  }

  async function saveVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await adminFetch(token, endpoints.videos, {
        body: JSON.stringify({
          ...data,
          isVisible: Boolean(data.isVisible),
        }),
        method: "POST",
      });
      setEditing(null);
      setNotice({ tone: "success", text: "Watch video saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <section className="admin-section">
      <div>
        <div className="admin-section__heading">
          <h2>Featured Video</h2>
          <p>The first visible video in this sortable list appears on the homepage.</p>
          <AdminButton tone="primary" onClick={() => setEditing(newVideo())}>
            Add Video
          </AdminButton>
        </div>
        <OrderedTable
          items={sorted}
          empty="No Watch videos found."
          endpoint={endpoints.videos}
          getTitle={(video) => video.title}
          refresh={refresh}
          renderMeta={(video) => video.youtubeUrl}
          setNotice={setNotice}
          token={token}
          onDelete={async (video) => {
            if (!window.confirm(`Delete ${video.title}?`)) return;
            await adminFetch(token, endpoints.videos, {
              body: JSON.stringify({ id: video.id }),
              method: "DELETE",
            });
            setNotice({ tone: "success", text: "Watch video deleted." });
            await refresh();
          }}
          onEdit={setEditing}
        />
      </div>

      {editing ? (
        <AdminDialog
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit Featured Video" : "Add Video"}
        >
        <form className="admin-form" onSubmit={saveVideo}>
          <label>
            ID
            <input name="id" defaultValue={editing.id} placeholder="auto-from-title" />
            <FieldError errors={errors} name="id" />
          </label>
          <label>
            Title
            <input name="title" defaultValue={editing.title} required />
            <FieldError errors={errors} name="title" />
          </label>
          <label>
            Note
            <input name="note" defaultValue={editing.note} required />
            <FieldError errors={errors} name="note" />
          </label>
          <label>
            YouTube URL
            <input name="youtubeUrl" defaultValue={editing.youtubeUrl} required />
            <FieldError errors={errors} name="youtubeUrl" />
          </label>
          <div className="admin-form__grid">
            <label>
              Sort order
              <input name="sortOrder" type="number" defaultValue={editing.sortOrder} />
            </label>
            <label className="admin-check">
              <input name="isVisible" type="checkbox" defaultChecked={editing.isVisible} />
              Visible
            </label>
          </div>
          <div className="admin-actions">
            <AdminButton onClick={() => setEditing(null)}>Cancel</AdminButton>
            <button className="admin-button admin-button--primary" type="submit">
              Save Video
            </button>
          </div>
        </form>
        </AdminDialog>
      ) : null}
    </section>
  );
}

function GigsSection({
  gigs,
  refresh,
  setNotice,
  token,
}: {
  gigs: LiveGig[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [editing, setEditing] = useState<LiveGig | null>(null);
  const [lineupChoice, setLineupChoice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sorted = ordered(gigs);

  function newGig(): LiveGig {
    return {
      id: "",
      event: "",
      venue: "",
      location: "",
      startsDate: "",
      startsTime: "",
      lineupType: null,
      lineupOther: null,
      ticketUrl: "",
      sortOrder: nextSortOrder(gigs),
      isVisible: true,
    };
  }

  async function saveGig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await adminFetch(token, endpoints.gigs, {
        body: JSON.stringify({
          ...data,
          isVisible: Boolean(data.isVisible),
        }),
        method: "POST",
      });
      setEditing(null);
      setNotice({ tone: "success", text: "Gig saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <section className="admin-section">
      <div>
        <div className="admin-section__heading">
          <h2>Gigs</h2>
          <p>Visible gigs stay public until you hide or delete them.</p>
          <AdminButton tone="primary" onClick={() => {
            setLineupChoice("");
            setEditing(newGig());
          }}>
            Add Gig
          </AdminButton>
        </div>
        <OrderedTable
          items={sorted}
          empty="No gigs found."
          endpoint={endpoints.gigs}
          getTitle={(gig) => gig.event}
          refresh={refresh}
          renderMeta={(gig) => `${gig.startsDate} ${gig.startsTime} / ${gig.location}`}
          setNotice={setNotice}
          token={token}
          onDelete={async (gig) => {
            if (!window.confirm(`Delete ${gig.event}?`)) return;
            await adminFetch(token, endpoints.gigs, {
              body: JSON.stringify({ id: gig.id }),
              method: "DELETE",
            });
            setNotice({ tone: "success", text: "Gig deleted." });
            await refresh();
          }}
          onEdit={(gig) => {
            setLineupChoice(gig.lineupType ?? "");
            setEditing(gig);
          }}
        />
      </div>

      {editing ? (
        <AdminDialog onClose={() => setEditing(null)} title={editing.id ? "Edit Gig" : "Add Gig"}>
          <form className="admin-form" onSubmit={saveGig}>
          <label>
            ID
            <input name="id" defaultValue={editing.id} placeholder="auto-from-event" />
            <FieldError errors={errors} name="id" />
          </label>
          <label>
            Event
            <input name="event" defaultValue={editing.event} required />
            <FieldError errors={errors} name="event" />
          </label>
          <label>
            Venue
            <input name="venue" defaultValue={editing.venue} required />
            <FieldError errors={errors} name="venue" />
          </label>
          <label>
            Location
            <input name="location" defaultValue={editing.location} required />
            <FieldError errors={errors} name="location" />
          </label>
          <div className="admin-form__grid">
            <label>
              Date
              <input name="startsDate" type="date" defaultValue={editing.startsDate} required />
              <FieldError errors={errors} name="startsDate" />
            </label>
            <label>
              Time
              <input name="startsTime" type="time" defaultValue={editing.startsTime} required />
              <FieldError errors={errors} name="startsTime" />
            </label>
          </div>
          <label>
            Lineup <small>Optional</small>
            <select
              name="lineupType"
              onChange={(event) => setLineupChoice(event.target.value)}
              value={lineupChoice}
            >
              <option value="">Not specified</option>
              <option value="SOLO">Solo</option>
              <option value="DUO">Duo</option>
              <option value="TRIO">Trio</option>
              <option value="QUARTET">Quartet</option>
              <option value="FULL_BAND">Full band</option>
              <option value="OTHER">Other</option>
            </select>
            <FieldError errors={errors} name="lineupType" />
          </label>
          {lineupChoice === "OTHER" ? (
            <label>
              Other lineup
              <input
                name="lineupOther"
                defaultValue={editing.lineupOther ?? ""}
                placeholder="For example, quintet"
                required
              />
              <FieldError errors={errors} name="lineupOther" />
            </label>
          ) : null}
          <label>
            Ticket link
            <input name="ticketUrl" defaultValue={editing.ticketUrl ?? ""} />
            <FieldError errors={errors} name="ticketUrl" />
          </label>
          <div className="admin-form__grid">
            <label>
              Sort order
              <input name="sortOrder" type="number" defaultValue={editing.sortOrder} />
            </label>
            <label className="admin-check">
              <input name="isVisible" type="checkbox" defaultChecked={editing.isVisible} />
              Visible
            </label>
          </div>
          <div className="admin-actions">
            <AdminButton onClick={() => setEditing(null)}>Cancel</AdminButton>
            <button className="admin-button admin-button--primary" type="submit">
              Save Gig
            </button>
          </div>
          </form>
        </AdminDialog>
      ) : null}
    </section>
  );
}

function AboutSection({
  about,
  refresh,
  setNotice,
  token,
}: {
  about: AboutContent;
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function saveAbout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await adminFetch(token, endpoints.about, {
        body: JSON.stringify(data),
        method: "PATCH",
      });
      setNotice({ tone: "success", text: "About page saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section__heading">
        <h2>About</h2>
        <p>Blank lines in the main bio become paragraphs.</p>
      </div>
      <form className="admin-form admin-form--wide" onSubmit={saveAbout}>
        <label>
          Eyebrow
          <input name="eyebrow" defaultValue={about.eyebrow} required />
          <FieldError errors={errors} name="eyebrow" />
        </label>
        <label>
          Header
          <input name="heading" defaultValue={about.heading} required />
          <FieldError errors={errors} name="heading" />
        </label>
        <label>
          Yellow sub header description
          <textarea name="highlight" defaultValue={about.highlight} rows={3} required />
          <FieldError errors={errors} name="highlight" />
        </label>
        <label>
          Main bio
          <textarea name="bodyText" defaultValue={about.bodyText} rows={12} required />
          <FieldError errors={errors} name="bodyText" />
        </label>
        <div className="admin-actions">
          <button className="admin-button admin-button--primary" type="submit">
            Save About Page
          </button>
        </div>
      </form>
    </section>
  );
}

function EpkSection({
  epk,
  music,
  refresh,
  setNotice,
  token,
}: {
  epk: EpkContent;
  music: MusicRelease[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [draft, setDraft] = useState(() => epk.selectedMusicIds.length ? epk : {
    ...epk,
    selectedMusicIds: music.filter((release) => release.isVisible).slice(0, 5).map((release) => release.id),
  });
  const [saving, setSaving] = useState(false);

  function move<T>(items: T[], index: number, offset: -1 | 1) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= items.length) return items;
    const next = [...items];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    return next;
  }

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await adminFetch(token, endpoints.epk, {
        method: "PATCH",
        body: JSON.stringify({
          ...draft,
          heroEyebrow: form.get("heroEyebrow"),
          heroTitle: form.get("heroTitle"),
          heroSubtitle: form.get("heroSubtitle"),
          positioningLine: draft.positioningLine,
          snapshotHeading: draft.snapshotHeading,
          snapshotBody: draft.snapshotBody,
          shortBio: form.get("shortBio"),
          fullBio: form.get("fullBio"),
          biographyQuote: draft.biographyQuote,
          musicHeading: form.get("musicHeading"),
          musicIntro: form.get("musicIntro"),
          riderHeading: form.get("riderHeading"),
          riderInputs: form.get("riderInputs"),
          riderRequirements: form.get("riderRequirements"),
          riderAdvance: form.get("riderAdvance"),
          contactHeading: form.get("contactHeading"),
          contactBody: form.get("contactBody"),
          contactEmail: form.get("contactEmail"),
          websiteUrl: form.get("websiteUrl"),
          instagramUrl: form.get("instagramUrl"),
          photoUsageNote: form.get("photoUsageNote"),
        }),
      });
      setNotice({ tone: "success", text: "EPK content published." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAsset(event: React.FormEvent<HTMLFormElement>, kind: "hero" | "portrait" | "pdf") {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    data.set("kind", kind);
    setSaving(true);
    try {
      await adminFetch(token, endpoints.epkAssets, { method: "POST", body: data });
      formElement.reset();
      setNotice({ tone: "success", text: kind === "pdf" ? "EPK PDF replaced." : "EPK picture replaced." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function addGalleryPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    try {
      await adminFetch(token, endpoints.epkGallery, { method: "POST", body: new FormData(formElement) });
      formElement.reset();
      setNotice({ tone: "success", text: "Press photo published." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function removeGalleryPhoto(item: EpkContent["gallery"][number]) {
    if (!window.confirm(`Delete "${item.title}" and its original file?`)) return;
    setSaving(true);
    try {
      await adminFetch(token, endpoints.epkGallery, {
        method: "DELETE",
        body: JSON.stringify({ id: item.id }),
      });
      setNotice({ tone: "success", text: "Press photo deleted." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section admin-epk">
      <div className="admin-section__heading">
        <div>
          <h2>Electronic Press Kit</h2>
          <p>Every successful save publishes immediately to <a href="/epk" target="_blank">/epk</a>.</p>
        </div>
      </div>

      <div className="admin-epk__assets">
        {([
          ["hero", "Hero picture", draft.heroImageUrl],
          ["portrait", "Biography portrait", draft.portraitImageUrl],
        ] as const).map(([kind, label, imageUrl]) => (
          <form className="admin-form admin-epk__asset" key={kind} onSubmit={(event) => void uploadAsset(event, kind)}>
            <h3>{label}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={imageUrl} />
            <label>
              Replacement image
              <input accept="image/jpeg,image/png,image/webp,image/avif,image/gif" name="file" required type="file" />
              <small>JPEG, PNG, WebP, AVIF or GIF; maximum 25 MB.</small>
            </label>
            <button className="admin-button admin-button--primary" disabled={saving} type="submit">Replace picture</button>
          </form>
        ))}
        <form className="admin-form admin-epk__asset" onSubmit={(event) => void uploadAsset(event, "pdf")}>
          <h3>Downloadable PDF</h3>
          <p><strong>{draft.pdfOriginalFilename}</strong></p>
          <label>
            Replacement PDF
            <input accept="application/pdf" name="file" required type="file" />
            <small>PDF only; maximum 50 MB.</small>
          </label>
          <button className="admin-button admin-button--primary" disabled={saving} type="submit">Replace PDF</button>
        </form>
      </div>

      <form className="admin-form admin-form--wide admin-epk__content" onSubmit={saveContent}>
        <h3>Page copy</h3>
        <div className="admin-form__grid">
          <label>Hero eyebrow<input defaultValue={draft.heroEyebrow} name="heroEyebrow" required /></label>
          <label>Artist name<input defaultValue={draft.heroTitle} name="heroTitle" required /></label>
        </div>
        <label>Hero roles<input defaultValue={draft.heroSubtitle} name="heroSubtitle" required /></label>
        <label>Short biography<textarea defaultValue={draft.shortBio} name="shortBio" required rows={5} /></label>
        <label>Full biography<textarea defaultValue={draft.fullBio} name="fullBio" required rows={10} /></label>
        <div className="admin-form__grid">
          <label>Music heading<input defaultValue={draft.musicHeading} name="musicHeading" required /></label>
          <label>Music introduction<textarea defaultValue={draft.musicIntro} name="musicIntro" required rows={3} /></label>
        </div>
        <label>Technical heading<input defaultValue={draft.riderHeading} name="riderHeading" required /></label>
        <label>Technical inputs<textarea defaultValue={draft.riderInputs} name="riderInputs" required rows={4} /></label>
        <label>Technical requirements<textarea defaultValue={draft.riderRequirements} name="riderRequirements" required rows={4} /></label>
        <label>Advance note<textarea defaultValue={draft.riderAdvance} name="riderAdvance" required rows={3} /></label>
        <div className="admin-form__grid">
          <label>Contact heading<input defaultValue={draft.contactHeading} name="contactHeading" required /></label>
          <label>Contact email<input defaultValue={draft.contactEmail} name="contactEmail" required type="email" /></label>
        </div>
        <label>Contact introduction<textarea defaultValue={draft.contactBody} name="contactBody" required rows={3} /></label>
        <div className="admin-form__grid">
          <label>Website URL<input defaultValue={draft.websiteUrl} name="websiteUrl" required type="url" /></label>
          <label>Instagram URL<input defaultValue={draft.instagramUrl} name="instagramUrl" required type="url" /></label>
        </div>
        <label>Press-photo usage note<textarea defaultValue={draft.photoUsageNote} name="photoUsageNote" required rows={3} /></label>

        <section className="admin-epk__highlights-editor" aria-labelledby="epk-highlights-heading">
          <div className="admin-epk__list-heading">
            <div>
              <h3 id="epk-highlights-heading">Selected highlights</h3>
              <small>These appear in this order on the public EPK page.</small>
            </div>
            <div className="admin-epk__list-tools">
              <span>{draft.highlights.length} {draft.highlights.length === 1 ? "item" : "items"}</span>
              <AdminButton onClick={() => setDraft((current) => ({
                ...current,
                highlights: [...current.highlights, { id: crypto.randomUUID(), body: "", sortOrder: current.highlights.length * 10 + 10 }],
              }))}>Add highlight</AdminButton>
            </div>
          </div>
          <div className="admin-epk__list admin-epk__highlight-list">
            {draft.highlights.length ? draft.highlights.map((item, index) => (
              <div key={item.id}>
                <label>
                  <span>Highlight {index + 1}</span>
                  <textarea
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      highlights: current.highlights.map((entry, itemIndex) => itemIndex === index ? { ...entry, body: event.target.value } : entry),
                    }))}
                    placeholder="Describe a notable performance, release, award, or press achievement."
                    required
                    rows={3}
                    value={item.body}
                  />
                </label>
                <div className="admin-row-actions">
                  <AdminButton disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, highlights: move(current.highlights, index, -1) }))}>Move up</AdminButton>
                  <AdminButton disabled={index === draft.highlights.length - 1} onClick={() => setDraft((current) => ({ ...current, highlights: move(current.highlights, index, 1) }))}>Move down</AdminButton>
                  <AdminButton tone="danger" onClick={() => setDraft((current) => ({ ...current, highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</AdminButton>
                </div>
              </div>
            )) : (
              <div className="admin-epk__list-empty">
                <p>No highlights are published.</p>
                <AdminButton onClick={() => setDraft((current) => ({
                  ...current,
                  highlights: [{ id: crypto.randomUUID(), body: "", sortOrder: 10 }],
                }))}>Add the first highlight</AdminButton>
              </div>
            )}
          </div>
        </section>

        <div className="admin-epk__list-heading">
          <h3>Key links</h3>
          <AdminButton onClick={() => setDraft((current) => ({
            ...current,
            links: [...current.links, { id: crypto.randomUUID(), label: "", url: "", sortOrder: current.links.length * 10 + 10 }],
          }))}>Add link</AdminButton>
        </div>
        <div className="admin-epk__list">
          {draft.links.map((item, index) => (
            <div key={item.id}>
              <div className="admin-form__grid">
                <label>Label<input onChange={(event) => setDraft((current) => ({ ...current, links: current.links.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry) }))} required value={item.label} /></label>
                <label>URL<input onChange={(event) => setDraft((current) => ({ ...current, links: current.links.map((entry, itemIndex) => itemIndex === index ? { ...entry, url: event.target.value } : entry) }))} required type="url" value={item.url} /></label>
              </div>
              <div className="admin-row-actions">
                <AdminButton disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, links: move(current.links, index, -1) }))}>Up</AdminButton>
                <AdminButton disabled={index === draft.links.length - 1} onClick={() => setDraft((current) => ({ ...current, links: move(current.links, index, 1) }))}>Down</AdminButton>
                <AdminButton tone="danger" onClick={() => setDraft((current) => ({ ...current, links: current.links.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</AdminButton>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-epk__list-heading">
          <h3>Press quotes</h3>
          <AdminButton onClick={() => setDraft((current) => ({
            ...current,
            quotes: [...current.quotes, { id: crypto.randomUUID(), quote: "", source: "", url: "", sortOrder: current.quotes.length * 10 + 10 }],
          }))}>Add quote</AdminButton>
        </div>
        <div className="admin-epk__list">
          {draft.quotes.map((item, index) => (
            <div key={item.id}>
              <label>Quote<textarea onChange={(event) => setDraft((current) => ({ ...current, quotes: current.quotes.map((entry, itemIndex) => itemIndex === index ? { ...entry, quote: event.target.value } : entry) }))} required value={item.quote} /></label>
              <div className="admin-form__grid">
                <label>Source<input onChange={(event) => setDraft((current) => ({ ...current, quotes: current.quotes.map((entry, itemIndex) => itemIndex === index ? { ...entry, source: event.target.value } : entry) }))} required value={item.source} /></label>
                <label>Source URL<input onChange={(event) => setDraft((current) => ({ ...current, quotes: current.quotes.map((entry, itemIndex) => itemIndex === index ? { ...entry, url: event.target.value } : entry) }))} required type="url" value={item.url} /></label>
              </div>
              <div className="admin-row-actions">
                <AdminButton disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, quotes: move(current.quotes, index, -1) }))}>Up</AdminButton>
                <AdminButton disabled={index === draft.quotes.length - 1} onClick={() => setDraft((current) => ({ ...current, quotes: move(current.quotes, index, 1) }))}>Down</AdminButton>
                <AdminButton tone="danger" onClick={() => setDraft((current) => ({ ...current, quotes: current.quotes.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</AdminButton>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-epk__list-heading">
          <div>
            <h3>Featured music</h3>
            <small>Select and order up to five published releases. The EPK shows titles and links only.</small>
          </div>
        </div>
        <div className="admin-epk__music">
          {music.length ? music.map((release) => {
            const selectedIndex = draft.selectedMusicIds.indexOf(release.id);
            const isSelected = selectedIndex !== -1;
            const atLimit = draft.selectedMusicIds.length >= 5;
            return (
              <div className="admin-epk__music-row" key={release.id}>
                <label>
                  <input
                    checked={isSelected}
                    disabled={!release.isVisible || (!isSelected && atLimit)}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      selectedMusicIds: event.target.checked
                        ? [...current.selectedMusicIds, release.id]
                        : current.selectedMusicIds.filter((id) => id !== release.id),
                    }))}
                    type="checkbox"
                  />
                  <span>{release.title}</span>
                  <small>{release.isVisible ? release.releaseType : "Unpublished"}</small>
                </label>
                {isSelected ? (
                  <div className="admin-row-actions">
                    <AdminButton
                      disabled={selectedIndex === 0}
                      onClick={() => setDraft((current) => ({
                        ...current,
                        selectedMusicIds: move(current.selectedMusicIds, selectedIndex, -1),
                      }))}
                    >
                      Up
                    </AdminButton>
                    <AdminButton
                      disabled={selectedIndex === draft.selectedMusicIds.length - 1}
                      onClick={() => setDraft((current) => ({
                        ...current,
                        selectedMusicIds: move(current.selectedMusicIds, selectedIndex, 1),
                      }))}
                    >
                      Down
                    </AdminButton>
                  </div>
                ) : null}
              </div>
            );
          }) : <p>Add releases in the Music section first.</p>}
        </div>

        {draft.gallery.length ? (
          <>
            <div className="admin-epk__list-heading"><h3>Published press photos</h3></div>
            <div className="admin-epk__list">
              {draft.gallery.map((item, index) => (
                <div className="admin-epk__gallery-row" key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" src={item.previewUrl} />
                  <div>
                    <label>Title<input onChange={(event) => setDraft((current) => ({ ...current, gallery: current.gallery.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry) }))} required value={item.title} /></label>
                    <label>Photographer credit<input onChange={(event) => setDraft((current) => ({ ...current, gallery: current.gallery.map((entry, itemIndex) => itemIndex === index ? { ...entry, credit: event.target.value } : entry) }))} required value={item.credit} /></label>
                    <small>{item.originalFilename} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</small>
                    <div className="admin-row-actions">
                      <AdminButton disabled={index === 0} onClick={() => setDraft((current) => ({ ...current, gallery: move(current.gallery, index, -1) }))}>Up</AdminButton>
                      <AdminButton disabled={index === draft.gallery.length - 1} onClick={() => setDraft((current) => ({ ...current, gallery: move(current.gallery, index, 1) }))}>Down</AdminButton>
                      <AdminButton tone="danger" onClick={() => void removeGalleryPhoto(item)}>Delete file</AdminButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="admin-actions">
          <button className="admin-button admin-button--primary" disabled={saving} type="submit">
            {saving ? "Publishing…" : "Publish EPK content"}
          </button>
        </div>
      </form>

      <form className="admin-form admin-form--wide admin-epk__upload" onSubmit={addGalleryPhoto}>
        <h3>Add press photo</h3>
        <div className="admin-form__grid">
          <label>Title<input name="title" required /></label>
          <label>Photographer credit<input name="credit" required /></label>
        </div>
        <div className="admin-form__grid">
          <label>
            Original image
            <input accept="image/jpeg,image/png,image/webp,image/avif,image/gif" name="image" required type="file" />
            <small>JPEG, PNG, WebP, AVIF or GIF; maximum 25 MB.</small>
          </label>
          <label>Order<input defaultValue={(draft.gallery.length + 1) * 10} min="0" name="sortOrder" type="number" /></label>
        </div>
        <button className="admin-button admin-button--primary" disabled={saving} type="submit">
          {saving ? "Uploading…" : "Upload and publish photo"}
        </button>
      </form>
    </section>
  );
}

function adminMoney(minor: number, currency: ShopOrder["currency"]) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

function OrdersSection({
  orders,
  refresh,
  setNotice,
  token,
}: {
  orders: ShopOrder[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  return (
    <section className="admin-section">
      <div className="admin-section__heading">
        <div>
          <h2>Orders</h2>
          <p>Paid orders, customer delivery details, and dispatch tracking.</p>
        </div>
      </div>
      <div className="admin-order-list">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            refresh={refresh}
            setNotice={setNotice}
            token={token}
          />
        ))}
        {!orders.length ? <p>No orders yet.</p> : null}
      </div>
    </section>
  );
}

function OrderCard({
  order,
  refresh,
  setNotice,
  token,
}: {
  order: ShopOrder;
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [shipping, setShipping] = useState(false);

  async function markShipped(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setShipping(true);
    try {
      const response = await adminFetch<{ emailWarning?: boolean }>(token, endpoints.orders, {
        method: "PATCH",
        body: JSON.stringify({
          action: "ship",
          id: order.id,
          carrier: data.get("carrier"),
          trackingNumber: data.get("trackingNumber"),
        }),
      });
      setNotice({
        tone: response.emailWarning ? "neutral" : "success",
        text: response.emailWarning
          ? "Order marked shipped, but the tracking email could not be sent."
          : "Order marked shipped and tracking email sent.",
      });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setShipping(false);
    }
  }

  return (
    <details className="admin-order-card">
      <summary>
        <strong>{order.order_number}</strong>
        <span>{order.customer_first_name} {order.customer_last_name}</span>
        <span>{adminMoney(order.total_minor, order.currency)}</span>
        <span className={`admin-status ${order.status === "paid" ? "is-visible" : "is-hidden"}`}>
          {order.status.replaceAll("_", " ")}
        </span>
        <time>{isoDateTime(order.created_at)}</time>
      </summary>
      <div className="admin-order-card__details">
        <div>
          <h3>Items</h3>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>{item.quantity} × {item.product_name}{item.variant_label ? ` — ${item.variant_label}` : ""}</span>
                <strong>{adminMoney(item.line_total_minor, order.currency)}</strong>
              </li>
            ))}
          </ul>
          <p>Items: {adminMoney(order.item_total_minor, order.currency)}</p>
          <p>Delivery: {adminMoney(order.shipping_total_minor, order.currency)}</p>
          <p><strong>Total: {adminMoney(order.total_minor, order.currency)}</strong></p>
          {order.customer_message ? <><h3>Buyer message</h3><p>{order.customer_message}</p></> : null}
        </div>
        <address>
          <h3>Customer &amp; delivery</h3>
          <p>{order.customer_first_name} {order.customer_last_name}</p>
          <p>{order.customer_email}<br />{order.customer_phone}</p>
          <p>
            {order.address_line_1}<br />
            {order.address_line_2 ? <>{order.address_line_2}<br /></> : null}
            {order.address_city}<br />
            {order.address_region ? <>{order.address_region}<br /></> : null}
            {order.address_postal_code}<br />
            {order.address_country_code}
          </p>
        </address>
        <div>
          <h3>Payment &amp; fulfilment</h3>
          <p>PayPal order: <code>{order.paypal_order_id || "—"}</code></p>
          <p>Capture: <code>{order.paypal_capture_id || "—"}</code></p>
          <p>Fulfilment: {order.fulfillment_status.replaceAll("_", " ")}</p>
          {order.tracking_number ? (
            <p>Tracking: {order.tracking_carrier} / {order.tracking_number}</p>
          ) : null}
          {order.status === "paid" && order.fulfillment_status !== "shipped" ? (
            <form className="admin-form admin-order-card__shipping" onSubmit={markShipped}>
              <label>Carrier<input name="carrier" required placeholder="Royal Mail" /></label>
              <label>Tracking number<input name="trackingNumber" required /></label>
              <button className="admin-button admin-button--primary" disabled={shipping} type="submit">
                {shipping ? "Sending…" : "Mark shipped & email customer"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function AdministratorsSection({
  accounts,
  audit,
  currentUserId,
  refresh,
  setNotice,
  token,
}: {
  accounts: AdminAccount[];
  audit: AdminAudit[];
  currentUserId: string;
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [saving, setSaving] = useState(false);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") || "");
    setSaving(true);
    try {
      const result = await adminFetch<{ warning?: string }>(token, endpoints.admins, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      form.reset();
      setNotice({
        tone: result.warning ? "neutral" : "success",
        text: result.warning || `Invitation sent to ${email}.`,
      });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function changeAccount(id: string, action: "resend" | "enable" | "disable") {
    setSaving(true);
    try {
      await adminFetch(token, endpoints.admins, {
        method: "PATCH",
        body: JSON.stringify({ id, action }),
      });
      setNotice({
        tone: "success",
        text: action === "resend" ? "Invitation sent." : `Administrator ${action}d.`,
      });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(account: AdminAccount) {
    if (!window.confirm(`Permanently remove ${account.email}? Their sessions will end immediately.`)) return;
    setSaving(true);
    try {
      await adminFetch(token, endpoints.admins, {
        method: "DELETE",
        body: JSON.stringify({ id: account.id }),
      });
      setNotice({ tone: "success", text: `${account.email} was removed.` });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="admin-section__heading">
        <div>
          <h2>Administrators</h2>
          <p>Invite administrators and control access. Only the owner can use these controls.</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={invite}>
        <h3>Invite administrator</h3>
        <label>
          Email
          <input autoComplete="email" name="email" required type="email" />
        </label>
        <button className="admin-button admin-button--primary" disabled={saving} type="submit">
          {saving ? "Working…" : "Send invitation"}
        </button>
      </form>

      <div className="admin-compact-list">
        {accounts.map((account) => (
          <div key={account.id}>
            <span>
              <strong>{account.email}</strong>
              <small>
                {account.role === "owner" ? "Owner" : "Full admin"} · {account.active ? "Active" : "Disabled"} · {account.passwordSet ? "Password set" : "Invitation pending"}
              </small>
            </span>
            <div className="admin-row-actions">
              {account.role === "admin" && account.active ? (
                <AdminButton disabled={saving} onClick={() => void changeAccount(account.id, "resend")}>
                  {account.passwordSet ? "Send password reset" : "Resend invitation"}
                </AdminButton>
              ) : null}
              {account.role === "admin" && account.id !== currentUserId ? (
                <AdminButton disabled={saving} onClick={() => void changeAccount(account.id, account.active ? "disable" : "enable")}>
                  {account.active ? "Disable" : "Enable"}
                </AdminButton>
              ) : null}
              {account.role === "admin" && account.id !== currentUserId ? (
                <AdminButton disabled={saving} onClick={() => void remove(account)} tone="danger">
                  Remove
                </AdminButton>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section__heading">
        <div>
          <h2>Access history</h2>
          <p>The 50 most recent administrator-management actions.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>When</th><th>Action</th><th>Administrator</th><th>By</th></tr></thead>
          <tbody>
            {audit.map((entry) => (
              <tr key={entry.id}>
                <td>{isoDateTime(entry.createdAt)}</td>
                <td>{entry.action.replaceAll("_", " ")}</td>
                <td>{entry.targetEmail}</td>
                <td>{entry.actorEmail}</td>
              </tr>
            ))}
            {!audit.length ? <tr><td colSpan={4}>No account-management actions yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AccountSection({
  onPasswordChanged,
  setNotice,
  token,
}: {
  onPasswordChanged: () => void;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [saving, setSaving] = useState(false);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextPassword = String(data.get("nextPassword") || "");
    if (nextPassword !== String(data.get("confirmation") || "")) {
      setNotice({ tone: "error", text: "The new passwords do not match." });
      return;
    }
    setSaving(true);
    try {
      await adminFetch(token, "/api/admin/auth/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: data.get("currentPassword"),
          nextPassword,
        }),
      });
      form.reset();
      onPasswordChanged();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section__heading">
        <div>
          <h2>Password</h2>
          <p>Changing it signs out every active admin session.</p>
        </div>
      </div>
      <form className="admin-form" onSubmit={changePassword}>
        <label>Current password<input autoComplete="current-password" name="currentPassword" required type="password" /></label>
        <label>
          New password
          <input autoComplete="new-password" minLength={12} name="nextPassword" required type="password" />
          <small>At least 12 characters with upper/lower case, a number and a symbol.</small>
        </label>
        <label>Confirm new password<input autoComplete="new-password" minLength={12} name="confirmation" required type="password" /></label>
        <button className="admin-button admin-button--primary" disabled={saving} type="submit">
          {saving ? "Changing…" : "Change password"}
        </button>
      </form>
    </section>
  );
}

function ShopSection({
  artworks,
  products,
  refresh,
  setNotice,
  token,
}: {
  artworks: ShopArtwork[];
  products: ShopProduct[];
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [productTypeChoice, setProductTypeChoice] = useState<"physical" | "digital">("physical");
  const [videoDeliveryChoice, setVideoDeliveryChoice] = useState<"upload" | "link">("upload");
  const [managingId, setManagingId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sorted = ordered(products);
  const managingProduct = products.find((product) => product.id === managingId) ?? null;

  function newProduct(): ShopProduct {
    return {
      id: "",
      name: "",
      category: "",
      categorySlug: "",
      note: "",
      description: "",
      priceGbp: 0,
      priceEur: 0,
      priceUsd: 0,
      status: "",
      saleMode: "purchase",
      productType: "physical",
      videoDeliveryType: null,
      videoExternalUrl: null,
      videoAsset: null,
      trackInventory: false,
      stockQuantity: 0,
      artwork: "vinyl",
      artworkId: null,
      frontArtworkUrl: null,
      backArtworkUrl: null,
      sortOrder: nextSortOrder(products),
      isVisible: true,
      variants: [],
      shippingRates: [],
      digitalAssets: [],
    };
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const productId = String(data.id || data.name || "").trim();
    const productName = String(data.name || "").trim();
    const videoFile = formData.get("videoFile");
    if (videoFile instanceof File && videoFile.size > 500 * 1024 * 1024) {
      setNotice({ tone: "error", text: "Choose a video file no larger than 500 MB." });
      return;
    }
    let artworkId = String(data.artworkId || "").trim();

    try {
      const frontArtwork = formData.get("frontArtwork");
      const backArtwork = formData.get("backArtwork");
      const hasFrontArtwork = frontArtwork instanceof File && frontArtwork.size > 0;
      const hasBackArtwork = backArtwork instanceof File && backArtwork.size > 0;

      if (hasFrontArtwork || hasBackArtwork) {
        const nextArtworkId = artworkId || productId || productName;
        const artworkFormData = new FormData();
        artworkFormData.set("id", nextArtworkId);
        artworkFormData.set("title", productName || nextArtworkId);
        artworkFormData.set("altText", productName);
        artworkFormData.set("sortOrder", String(data.sortOrder || nextSortOrder(artworks)));
        if (hasFrontArtwork) artworkFormData.set("front", frontArtwork);
        if (hasBackArtwork) artworkFormData.set("back", backArtwork);

        const artworkResponse = await adminFetch<{ artwork: ShopArtwork | null }>(
          token,
          endpoints.shopArtwork,
          {
            body: artworkFormData,
            method: "POST",
          },
        );
        artworkId = artworkResponse.artwork?.id ?? nextArtworkId;
      }

      const saved = await adminFetch<{ product: ShopProduct }>(token, endpoints.products, {
        body: JSON.stringify({
          ...data,
          artworkId,
          frontArtwork: undefined,
          backArtwork: undefined,
          videoFile: undefined,
          isVisible: Boolean(data.isVisible),
          trackInventory: Boolean(data.trackInventory),
        }),
        method: "POST",
      });
      if (productTypeChoice === "digital" && videoDeliveryChoice === "upload" &&
          videoFile instanceof File && videoFile.size > 0) {
        const contentType = videoFile.type || "application/octet-stream";
        const started = await adminFetch<{ key: string; uploadId: string }>(token, endpoints.videoAssets, {
          body: JSON.stringify({ action: "start", productId: saved.product.id, filename: videoFile.name, contentType, sizeBytes: videoFile.size }),
          method: "POST",
        });
        const parts: Array<{ partNumber: number; etag: string }> = [];
        const partSize = 50 * 1024 * 1024;
        for (let offset = 0, partNumber = 1; offset < videoFile.size; offset += partSize, partNumber += 1) {
          setNotice({ tone: "neutral", text: `Uploading video part ${partNumber}…` });
          const chunk = videoFile.slice(offset, Math.min(offset + partSize, videoFile.size), contentType);
          const uploaded = await adminFetch<{ etag: string; partNumber: number }>(
            token,
            `${endpoints.videoAssets}?productId=${encodeURIComponent(saved.product.id)}&key=${encodeURIComponent(started.key)}&uploadId=${encodeURIComponent(started.uploadId)}&partNumber=${partNumber}`,
            { body: chunk, headers: { "Content-Type": contentType }, method: "PUT" },
          );
          parts.push({ partNumber: uploaded.partNumber, etag: uploaded.etag });
        }
        await adminFetch(token, endpoints.videoAssets, {
          body: JSON.stringify({ action: "complete", productId: saved.product.id, filename: videoFile.name, contentType, sizeBytes: videoFile.size, key: started.key, uploadId: started.uploadId, parts }),
          method: "POST",
        });
      }
      setEditing(null);
      setNotice({ tone: "success", text: "Shop item saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <section className="admin-section">
        <div className="admin-section__heading">
          <h2>Shop</h2>
          <p>Manage products, prices, availability, variants, stock, and delivery.</p>
          <AdminButton tone="primary" onClick={() => {
            setProductTypeChoice("physical"); setVideoDeliveryChoice("upload"); setEditing(newProduct());
          }}>
            Add Item
          </AdminButton>
        </div>
        <OrderedTable
          items={sorted}
          empty="No shop items found."
          endpoint={endpoints.products}
          getTitle={(product) => product.name}
          refresh={refresh}
          renderMeta={(product) => `${product.category} / ${product.saleMode} / GBP ${product.priceGbp}`}
          setNotice={setNotice}
          token={token}
          onDelete={async (product) => {
            if (!window.confirm(`Delete ${product.name}?`)) return;
            await adminFetch(token, endpoints.products, {
              body: JSON.stringify({ id: product.id }),
              method: "DELETE",
            });
            setNotice({ tone: "success", text: "Shop item deleted." });
            await refresh();
          }}
          onEdit={(product) => {
            setProductTypeChoice(product.productType);
            setVideoDeliveryChoice(product.videoDeliveryType ?? "upload");
            setEditing(product);
          }}
          onManage={(product) => setManagingId(product.id)}
        />

      {editing ? (
        <AdminDialog
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit Shop Item" : "Add Shop Item"}
        >
        <form className="admin-form" onSubmit={saveProduct}>
          <label>
            ID
            <input name="id" defaultValue={editing.id} placeholder="auto-from-name" />
            <FieldError errors={errors} name="id" />
          </label>
          <label>
            Name
            <input name="name" defaultValue={editing.name} required />
            <FieldError errors={errors} name="name" />
          </label>
          <div className="admin-form__grid">
            <label>
              Category
              <input name="category" defaultValue={editing.category} required />
              <FieldError errors={errors} name="category" />
            </label>
            <label>
              Category slug
              <input name="categorySlug" defaultValue={editing.categorySlug} placeholder="auto" />
              <FieldError errors={errors} name="categorySlug" />
            </label>
          </div>
          <label>
            Note
            <textarea name="note" defaultValue={editing.note} rows={3} required />
            <FieldError errors={errors} name="note" />
          </label>
          <label>
            Description
            <textarea name="description" defaultValue={editing.description} rows={5} required />
            <FieldError errors={errors} name="description" />
          </label>
          <div className="admin-form__grid">
            <label>
              GBP
              <input name="priceGbp" type="number" defaultValue={editing.priceGbp} min={0} />
              <FieldError errors={errors} name="priceGbp" />
            </label>
            <label>
              EUR
              <input name="priceEur" type="number" defaultValue={editing.priceEur} min={0} />
              <FieldError errors={errors} name="priceEur" />
            </label>
            <label>
              USD
              <input name="priceUsd" type="number" defaultValue={editing.priceUsd} min={0} />
              <FieldError errors={errors} name="priceUsd" />
            </label>
          </div>
          <label>
            Status text
            <input name="status" defaultValue={editing.status} required />
            <FieldError errors={errors} name="status" />
          </label>
          <div className="admin-form__grid">
            <label>
              How this item is offered
              <select name="saleMode" defaultValue={editing.saleMode}>
                <option value="purchase">Buy online</option>
                <option value="enquiry">Enquiry only</option>
                <option value="unavailable">Unavailable for now</option>
              </select>
            </label>
            <label>
              Product type
              <select name="productType" value={productTypeChoice} onChange={(event) => setProductTypeChoice(event.target.value as "physical" | "digital")}>
                <option value="physical">Physical item</option>
                <option value="digital">Video</option>
              </select>
            </label>
            <label className="admin-check">
              <input name="trackInventory" type="checkbox" defaultChecked={editing.trackInventory} />
              Track stock
            </label>
            <label>
              Base stock quantity
              <input name="stockQuantity" type="number" defaultValue={editing.stockQuantity} min={0} />
              <small>Used when this product has no variants.</small>
            </label>
          </div>
          {productTypeChoice === "digital" ? (
            <div className="admin-form__grid">
              <label>
                Video delivery
                <select name="videoDeliveryType" value={videoDeliveryChoice} onChange={(event) => setVideoDeliveryChoice(event.target.value as "upload" | "link")}>
                  <option value="upload">Upload video</option>
                  <option value="link">Video or download link</option>
                </select>
              </label>
              {videoDeliveryChoice === "link" ? (
                <label>
                  Private video/download URL
                  <input name="videoExternalUrl" type="url" defaultValue={editing.videoExternalUrl ?? ""} required />
                  <small>Revealed automatically only after successful payment.</small>
                  <FieldError errors={errors} name="videoExternalUrl" />
                </label>
              ) : (
                <label>
                  Video file
                  <input name="videoFile" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" required={!editing.videoAsset} />
                  <small>{editing.videoAsset ? `${editing.videoAsset.originalFilename} is stored. Upload to replace it.` : "MP4, WebM, or MOV; maximum 500 MB."}</small>
                </label>
              )}
            </div>
          ) : null}
          <label>
            Product artwork
            <select name="artworkId" defaultValue={editing.artworkId ?? ""}>
              <option value="">Use fallback style</option>
              {artworks.map((artwork) => (
                <option key={artwork.id} value={artwork.id}>
                  {artwork.title}
                  {artwork.backUrl ? " (front/back)" : " (front only)"}
                </option>
              ))}
            </select>
            <FieldError errors={errors} name="artworkId" />
          </label>
          <div className="admin-form__grid">
            <label>
              Front image
              <input name="frontArtwork" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
              {editing.frontArtworkUrl ? <small>Current front image is stored.</small> : null}
              <FieldError errors={errors} name="front" />
            </label>
            <label>
              Back image
              <input name="backArtwork" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
              {editing.backArtworkUrl ? <small>Current back image is stored.</small> : null}
            </label>
          </div>
          <div className="admin-form__grid">
            <label>
              Artwork
              <select name="artwork" defaultValue={editing.artwork}>
                <option value="vinyl">Vinyl</option>
                <option value="book">Book</option>
                <option value="shirt">Shirt</option>
                <option value="session">Session</option>
              </select>
            </label>
            <label>
              Sort order
              <input name="sortOrder" type="number" defaultValue={editing.sortOrder} />
            </label>
            <label className="admin-check">
              <input name="isVisible" type="checkbox" defaultChecked={editing.isVisible} />
              Visible
            </label>
          </div>
          <div className="admin-actions">
            <AdminButton onClick={() => setEditing(null)}>Cancel</AdminButton>
            <button className="admin-button admin-button--primary" type="submit">
              Save Item
            </button>
          </div>
        </form>
        </AdminDialog>
      ) : null}
      {managingProduct ? (
        <ProductCommerceDialog
          onClose={() => setManagingId("")}
          product={managingProduct}
          refresh={refresh}
          setNotice={setNotice}
          token={token}
        />
      ) : null}
      </section>
  );
}

function ProductCommerceDialog({
  onClose,
  product,
  refresh,
  setNotice,
  token,
}: {
  onClose: () => void;
  product: ShopProduct;
  refresh: () => Promise<void>;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  const countries = useMemo(() => countryOptions(), []);
  const [editingVariant, setEditingVariant] = useState<ShopVariant | null>(null);
  const [editingRate, setEditingRate] = useState<ShopShippingRate | null>(null);

  function variantOptionsText(variant: ShopVariant | null) {
    return variant
      ? Object.entries(variant.options).map(([name, value]) => `${name}: ${value}`).join(", ")
      : "";
  }

  async function saveVariant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const options: Record<string, string> = {};
    for (const part of String(data.get("options") || "").split(",")) {
      const separator = part.indexOf(":");
      if (separator < 1) continue;
      const name = part.slice(0, separator).trim();
      const value = part.slice(separator + 1).trim();
      if (name && value) options[name] = value;
    }
    if (!Object.keys(options).length) {
      setNotice({ tone: "error", text: "Add at least one option, for example Size: Medium." });
      return;
    }
    try {
      await adminFetch(token, endpoints.variants, {
        method: "POST",
        body: JSON.stringify({
          id: editingVariant?.id,
          productId: product.id,
          label: data.get("label"),
          sku: data.get("sku"),
          options,
          stockQuantity: data.get("stockQuantity"),
          isAvailable: Boolean(data.get("isAvailable")),
          sortOrder: data.get("sortOrder"),
        }),
      });
      form.reset();
      setEditingVariant(null);
      setNotice({ tone: "success", text: "Variant saved." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  async function deleteVariant(variant: ShopVariant) {
    if (!window.confirm(`Delete ${variant.label}?`)) return;
    try {
      await adminFetch(token, endpoints.variants, {
        method: "DELETE",
        body: JSON.stringify({ id: variant.id }),
      });
      setEditingVariant(null);
      setNotice({ tone: "success", text: "Variant deleted." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  async function saveRate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await adminFetch(token, endpoints.shippingRates, {
        method: "POST",
        body: JSON.stringify({
          id: editingRate?.id,
          productId: product.id,
          countryCode: data.get("countryCode"),
          feeGbp: data.get("feeGbp"),
          feeEur: data.get("feeEur"),
          feeUsd: data.get("feeUsd"),
        }),
      });
      form.reset();
      setEditingRate(null);
      setNotice({ tone: "success", text: "Delivery price saved." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  async function deleteRate(rate: ShopShippingRate) {
    if (!window.confirm(`Remove delivery to ${rate.countryCode}?`)) return;
    try {
      await adminFetch(token, endpoints.shippingRates, {
        method: "DELETE",
        body: JSON.stringify({ id: rate.id }),
      });
      setEditingRate(null);
      setNotice({ tone: "success", text: "Delivery country removed." });
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    }
  }

  return (
    <AdminDialog onClose={onClose} title={`${product.name}: variants & delivery`}>
      <div className="admin-commerce-editor">
        {product.productType === "physical" ? <section>
          <h4>Variants</h4>
          <p>Add each combination the customer can choose. All variants use the product prices.</p>
          <form className="admin-form" key={editingVariant?.id ?? "new-variant"} onSubmit={saveVariant}>
            <div className="admin-form__grid">
              <label>
                Display label
                <input name="label" defaultValue={editingVariant?.label ?? ""} required placeholder="Black / Medium" />
              </label>
              <label>
                SKU <small>Optional</small>
                <input name="sku" defaultValue={editingVariant?.sku ?? ""} />
              </label>
            </div>
            <label>
              Options
              <input name="options" defaultValue={variantOptionsText(editingVariant)} required placeholder="Colour: Black, Size: Medium" />
              <small>Separate option names with commas.</small>
            </label>
            <div className="admin-form__grid">
              <label>
                Stock
                <input name="stockQuantity" defaultValue={editingVariant?.stockQuantity ?? 0} min={0} type="number" />
              </label>
              <label>
                Sort order
                <input name="sortOrder" defaultValue={editingVariant?.sortOrder ?? nextSortOrder(product.variants)} type="number" />
              </label>
              <label className="admin-check">
                <input name="isAvailable" type="checkbox" defaultChecked={editingVariant?.isAvailable ?? true} />
                Available
              </label>
            </div>
            <div className="admin-actions">
              {editingVariant ? <AdminButton onClick={() => setEditingVariant(null)}>Cancel edit</AdminButton> : null}
              <button className="admin-button admin-button--primary" type="submit">
                {editingVariant ? "Save variant" : "Add variant"}
              </button>
            </div>
          </form>
          <div className="admin-compact-list">
            {ordered(product.variants.map((variant) => ({ ...variant, isVisible: variant.isAvailable }))).map((variant) => (
              <div key={variant.id}>
                <span><strong>{variant.label}</strong><small>{variant.sku || "No SKU"} / stock {variant.stockQuantity}</small></span>
                <div className="admin-row-actions">
                  <AdminButton onClick={() => setEditingVariant(variant)}>Edit</AdminButton>
                  <AdminButton tone="danger" onClick={() => void deleteVariant(variant)}>Delete</AdminButton>
                </div>
              </div>
            ))}
            {!product.variants.length ? <p>No variants. The product uses its base stock quantity.</p> : null}
          </div>
        </section> : null}

        {product.productType === "physical" ? <section>
          <h4>Delivery by country</h4>
          <p>Enter all three currencies. The delivery fee is charged once for this product, even when quantity is more than one.</p>
          <form className="admin-form" key={editingRate?.id ?? "new-rate"} onSubmit={saveRate}>
            <label>
              Country
              <select name="countryCode" defaultValue={editingRate?.countryCode ?? ""} required>
                <option value="">Choose country</option>
                {countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
              </select>
            </label>
            <div className="admin-form__grid">
              <label>GBP delivery<input name="feeGbp" defaultValue={editingRate?.feeGbp ?? 0} min={0} step="0.01" type="number" /></label>
              <label>EUR delivery<input name="feeEur" defaultValue={editingRate?.feeEur ?? 0} min={0} step="0.01" type="number" /></label>
              <label>USD delivery<input name="feeUsd" defaultValue={editingRate?.feeUsd ?? 0} min={0} step="0.01" type="number" /></label>
            </div>
            <div className="admin-actions">
              {editingRate ? <AdminButton onClick={() => setEditingRate(null)}>Cancel edit</AdminButton> : null}
              <button className="admin-button admin-button--primary" type="submit">
                {editingRate ? "Save delivery" : "Add country"}
              </button>
            </div>
          </form>
          <div className="admin-compact-list">
            {[...product.shippingRates].sort((a, b) => a.countryCode.localeCompare(b.countryCode)).map((rate) => (
              <div key={rate.id}>
                <span><strong>{rate.countryCode}</strong><small>£{rate.feeGbp.toFixed(2)} / €{rate.feeEur.toFixed(2)} / ${rate.feeUsd.toFixed(2)}</small></span>
                <div className="admin-row-actions">
                  <AdminButton onClick={() => setEditingRate(rate)}>Edit</AdminButton>
                  <AdminButton tone="danger" onClick={() => void deleteRate(rate)}>Delete</AdminButton>
                </div>
              </div>
            ))}
            {!product.shippingRates.length ? <p>This product cannot be bought until at least one delivery country is added.</p> : null}
          </div>
        </section> : <section><h4>Video delivery</h4><p>Edit this item to replace its private video upload or payment-only link.</p></section>}
      </div>
    </AdminDialog>
  );
}

function OrderedTable<T extends { id: string; sortOrder: number; isVisible: boolean }>({
  empty,
  endpoint,
  getTitle,
  items,
  onDelete,
  onEdit,
  onManage,
  onVisibility,
  refresh,
  renderMeta,
  setNotice,
  token,
}: {
  empty: string;
  endpoint: string;
  getTitle: (item: T) => string;
  items: T[];
  onDelete: (item: T) => Promise<void>;
  onEdit: (item: T) => void;
  onManage?: (item: T) => void;
  onVisibility?: (item: T) => Promise<void>;
  refresh: () => Promise<void>;
  renderMeta: (item: T) => string;
  setNotice: (notice: Notice) => void;
  token: string;
}) {
  async function moveItem(item: T, direction: -1 | 1) {
    const index = items.findIndex((candidate) => candidate.id === item.id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const nextItems = [...items];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    await adminFetch(token, endpoint, {
      body: JSON.stringify({ action: "reorder", ids: nextItems.map((nextItem) => nextItem.id) }),
      method: "PATCH",
    });
    setNotice({ tone: "success", text: "Order updated." });
    await refresh();
  }

  async function toggleVisibility(item: T) {
    if (onVisibility) {
      await onVisibility(item);
      return;
    }

    await adminFetch(token, endpoint, {
      body: JSON.stringify({
        action: "visibility",
        id: item.id,
        isVisible: !item.isVisible,
      }),
      method: "PATCH",
    });
    setNotice({ tone: "success", text: "Visibility updated." });
    await refresh();
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-ordered-table">
        <colgroup>
          <col className="admin-ordered-table__order" />
          <col className="admin-ordered-table__item" />
          <col className="admin-ordered-table__status" />
          <col className="admin-ordered-table__actions" />
        </colgroup>
        <thead>
          <tr>
            <th>Order</th>
            <th>Item</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="admin-ordered-table__order-cell">
                <strong>{index + 1}</strong>
                <div className="admin-row-actions">
                  <AdminButton
                    aria-label={`Move ${getTitle(item)} up`}
                    onClick={() => void moveItem(item, -1)}
                    disabled={index === 0}
                  >
                    &uarr;
                  </AdminButton>
                  <AdminButton
                    aria-label={`Move ${getTitle(item)} down`}
                    onClick={() => void moveItem(item, 1)}
                    disabled={index === items.length - 1}
                  >
                    &darr;
                  </AdminButton>
                </div>
              </td>
              <td className="admin-ordered-table__item-cell">
                <strong>{getTitle(item)}</strong>
                <small>{item.id}</small>
                <span>{renderMeta(item)}</span>
              </td>
              <td className="admin-ordered-table__status-cell">
                <VisibilityBadge visible={item.isVisible} />
              </td>
              <td className="admin-ordered-table__actions-cell">
                <div className="admin-row-actions">
                  <AdminButton onClick={() => onEdit(item)}>Edit</AdminButton>
                  {onManage ? <AdminButton onClick={() => onManage(item)}>Variants &amp; delivery</AdminButton> : null}
                  <AdminButton onClick={() => void toggleVisibility(item)}>
                    {item.isVisible ? "Hide" : "Show"}
                  </AdminButton>
                  <AdminButton tone="danger" onClick={() => void onDelete(item)}>
                    Delete
                  </AdminButton>
                </div>
              </td>
            </tr>
          ))}
          {!items.length ? (
            <tr>
              <td colSpan={4}>{empty}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
