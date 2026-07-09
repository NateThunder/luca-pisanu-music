"use client";

import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  artwork: "portrait" | "tower" | "guitar" | "waves";
  artworkId: string | null;
  coverArtUrl: string | null;
  audioUrl: string | null;
  listenUrl: string | null;
  supportUrl: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
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
  timezone: string;
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
  artwork: "vinyl" | "book" | "shirt" | "session";
  artworkId: string | null;
  frontArtworkUrl: string | null;
  backArtworkUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
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
  gigs: LiveGig[];
  about: AboutContent;
  products: ShopProduct[];
  shopArtworks: ShopArtwork[];
};

type SectionId =
  | "comments"
  | "music"
  | "videos"
  | "gigs"
  | "about"
  | "shop";
type Notice = { tone: "neutral" | "success" | "error"; text: string };

const storageKey = "luca-admin-token";
const endpoints = {
  about: "/api/admin/about",
  comments: "/api/admin/comments",
  gigs: "/api/admin/live-gigs",
  musicArtwork: "/api/admin/music/artwork",
  music: "/api/admin/music/releases",
  shopArtwork: "/api/admin/shop/artwork",
  products: "/api/admin/shop/products",
  videos: "/api/admin/watch-videos",
} as const;

const emptyAbout: AboutContent = {
  eyebrow: "",
  heading: "",
  highlight: "",
  bodyText: "",
};

const sections: Array<{ id: SectionId; label: string }> = [
  { id: "comments", label: "Comments" },
  { id: "music", label: "Music" },
  { id: "videos", label: "Watch Video" },
  { id: "gigs", label: "Gigs" },
  { id: "about", label: "About" },
  { id: "shop", label: "Shop" },
];

function emptyData(): AdminData {
  return {
    comments: [],
    music: [],
    musicArtworks: [],
    videos: [],
    gigs: [],
    about: emptyAbout,
    products: [],
    shopArtworks: [],
  };
}

async function adminFetch<T>(
  token: string,
  path: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const json = (await response.json()) as ApiEnvelope & T;

  if (!response.ok || !json.ok) {
    const error = new Error(json.message || "Request failed.") as Error & {
      fieldErrors?: Record<string, string>;
      status?: number;
    };
    error.fieldErrors = json.fieldErrors;
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
  const [tokenInput, setTokenInput] = useState("");
  const [activeSection, setActiveSection] = useState<SectionId>("comments");
  const [data, setData] = useState<AdminData>(emptyData);
  const [notice, setNotice] = useState<Notice>({
    tone: "neutral",
    text: "Enter the password to continue.",
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
        gigs,
        about,
        products,
        shopArtworks,
      ] = await Promise.all([
        adminFetch<{ comments: AdminComment[] }>(nextToken, endpoints.comments),
        adminFetch<{ releases: MusicRelease[] }>(nextToken, endpoints.music),
        adminFetch<{ artworks: MusicArtwork[] }>(nextToken, endpoints.musicArtwork),
        adminFetch<{ videos: WatchVideo[] }>(nextToken, endpoints.videos),
        adminFetch<{ gigs: LiveGig[] }>(nextToken, endpoints.gigs),
        adminFetch<{ about: AboutContent }>(nextToken, endpoints.about),
        adminFetch<{ products: ShopProduct[] }>(nextToken, endpoints.products),
        adminFetch<{ artworks: ShopArtwork[] }>(nextToken, endpoints.shopArtwork),
      ]);

      setData({
        comments: comments.comments,
        music: music.releases,
        musicArtworks: musicArtworks.artworks,
        videos: videos.videos,
        gigs: gigs.gigs,
        about: about.about,
        products: products.products,
        shopArtworks: shopArtworks.artworks,
      });
      setNotice({ tone: "success", text: "Admin content loaded." });
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 401) {
        window.sessionStorage.removeItem(storageKey);
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

  useEffect(() => {
    const saved = window.sessionStorage.getItem(storageKey) || "";
    if (!saved) return;
    const timeout = window.setTimeout(() => {
      setToken(saved);
      setTokenInput(saved);
      void loadAll(saved);
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) {
      setNotice({ tone: "error", text: "Password is required." });
      return;
    }

    window.sessionStorage.setItem(storageKey, cleaned);
    setToken(cleaned);
    void loadAll(cleaned);
  }

  function logout() {
    window.sessionStorage.removeItem(storageKey);
    setToken("");
    setTokenInput("");
    setData(emptyData());
    setNotice({ tone: "neutral", text: "Logged out." });
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
              Password
              <input
                autoComplete="current-password"
                autoFocus
                onChange={(event) => setTokenInput(event.target.value)}
                required
                type="password"
                value={tokenInput}
              />
            </label>
            <button className="admin-button admin-button--primary" type="submit">
              Log in
            </button>
          </form>
        </div>
      </section>
    );
  }

  const counts = {
    about: data.about.heading ? 1 : 0,
    comments: data.comments.length,
    gigs: data.gigs.length,
    music: data.music.length,
    shop: data.products.length,
    videos: data.videos.length,
  };

  return (
    <section className="admin-shell" aria-label="Website admin">
      <aside className="admin-nav" aria-label="Admin sections">
        <div className="admin-nav__brand">
          <span>Admin</span>
          <strong>Luca 4</strong>
        </div>
        {sections.map((section) => (
          <button
            aria-current={activeSection === section.id ? "page" : undefined}
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            type="button"
          >
            <span>{section.label}</span>
            <small>{counts[section.id === "shop" ? "shop" : section.id]}</small>
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
            <AdminButton onClick={logout}>Logout</AdminButton>
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
          <WatchVideoSection
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
        {activeSection === "shop" ? (
          <ShopSection
            artworks={data.shopArtworks}
            products={data.products}
            refresh={loadAll}
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
  const sorted = ordered(releases);

  function newRelease(): MusicRelease {
    return {
      id: "",
      title: "",
      description: "",
      artwork: "portrait",
      artworkId: null,
      coverArtUrl: null,
      audioUrl: null,
      listenUrl: "",
      supportUrl: "",
      spotifyUrl: "",
      appleMusicUrl: "",
      youtubeUrl: "",
      soundcloudUrl: "",
      bandcampUrl: "",
      sortOrder: nextSortOrder(releases),
      isVisible: true,
    };
  }

  async function saveRelease(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const form = event.currentTarget;
    const formData = new FormData(form);
    const releaseId = String(formData.get("id") || formData.get("title") || "").trim();
    const releaseTitle = String(formData.get("title") || "").trim();
    let artworkId = String(formData.get("artworkId") || "").trim();
    formData.set("isVisible", formData.get("isVisible") ? "true" : "false");

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

      await adminFetch(token, endpoints.music, {
        body: formData,
        method: "POST",
      });
      form.reset();
      setEditing(null);
      setNotice({ tone: "success", text: "Music release saved." });
      await refresh();
    } catch (error) {
      setErrors((error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {});
      setNotice({ tone: "error", text: (error as Error).message });
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
        <OrderedTable
          items={sorted}
          empty="No releases found."
          endpoint={endpoints.music}
          getTitle={(release) => release.title}
          refresh={refresh}
          renderMeta={(release) => release.description}
          setNotice={setNotice}
          token={token}
          onDelete={deleteRelease}
          onEdit={setEditing}
          onVisibility={(release) =>
            patchRelease("visibility", { id: release.id, isVisible: !release.isVisible })
          }
        />
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
              Visible
            </label>
          </div>
          <label>
            Audio
            <input name="audio" type="file" accept="audio/*" />
            {editing.audioUrl ? <small>Current audio is stored.</small> : null}
          </label>
          <UrlFields item={editing} errors={errors} />
          <div className="admin-actions">
            <AdminButton onClick={() => setEditing(null)}>Cancel</AdminButton>
            <button className="admin-button admin-button--primary" type="submit">
              Save Release
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
    ["listenUrl", "Listen URL"],
    ["supportUrl", "Support URL"],
    ["spotifyUrl", "Spotify URL"],
    ["appleMusicUrl", "Apple Music URL"],
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
          <h2>Watch Video</h2>
          <p>The first visible video appears on the homepage Watch section.</p>
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
          title={editing.id ? "Edit Watch Video" : "Add Watch Video"}
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
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sorted = ordered(gigs);
  const timezones = useMemo(() => {
    const intl = Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    };
    return intl.supportedValuesOf?.("timeZone") ?? ["Europe/London", "Europe/Rome", "America/New_York"];
  }, []);
  const visibleTimezones = useMemo(() => {
    const query = timezoneSearch.trim().toLowerCase();
    return timezones
      .filter((timezone) => !query || timezone.toLowerCase().includes(query))
      .slice(0, 120);
  }, [timezoneSearch, timezones]);

  function newGig(): LiveGig {
    return {
      id: "",
      event: "",
      venue: "",
      location: "",
      startsDate: "",
      startsTime: "",
      timezone: "Europe/London",
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
          <AdminButton tone="primary" onClick={() => setEditing(newGig())}>
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
          onEdit={setEditing}
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
            Search timezone city
            <input
              onChange={(event) => setTimezoneSearch(event.target.value)}
              placeholder="London, Rome, New York"
              value={timezoneSearch}
            />
          </label>
          <label>
            Timezone
            <input
              defaultValue={editing.timezone}
              list="admin-timezones"
              name="timezone"
              required
            />
            <datalist id="admin-timezones">
              {visibleTimezones.map((timezone) => (
                <option key={timezone} value={timezone} />
              ))}
            </datalist>
            <FieldError errors={errors} name="timezone" />
          </label>
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sorted = ordered(products);

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
      artwork: "vinyl",
      artworkId: null,
      frontArtworkUrl: null,
      backArtworkUrl: null,
      sortOrder: nextSortOrder(products),
      isVisible: true,
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

      await adminFetch(token, endpoints.products, {
        body: JSON.stringify({
          ...data,
          artworkId,
          frontArtwork: undefined,
          backArtwork: undefined,
          isVisible: Boolean(data.isVisible),
        }),
        method: "POST",
      });
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
          <p>Manage product copy, prices, front/back artwork, and visibility.</p>
          <AdminButton tone="primary" onClick={() => setEditing(newProduct())}>
            Add Item
          </AdminButton>
        </div>
        <OrderedTable
          items={sorted}
          empty="No shop items found."
          endpoint={endpoints.products}
          getTitle={(product) => product.name}
          refresh={refresh}
          renderMeta={(product) => `${product.category} / GBP ${product.priceGbp}`}
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
          onEdit={setEditing}
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
      </section>
  );
}

function OrderedTable<T extends { id: string; sortOrder: number; isVisible: boolean }>({
  empty,
  endpoint,
  getTitle,
  items,
  onDelete,
  onEdit,
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
