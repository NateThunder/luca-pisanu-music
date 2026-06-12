"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { YouTubeVideoItem, YouTubeVideosResponse } from "@/lib/youtube";
import { PlayIcon } from "@/components/ui";
import styles from "./YouTubeVideoBrowser.module.css";

type ApiResponse = {
  data?: YouTubeVideosResponse;
  error?: string;
  code?: string;
};

type BrowserStatus = "loading" | "idle" | "error";
type VideoTab = "videos" | "shorts";

const MAX_RESULTS = 24;

function formatDate(value: string): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function getEmbedUrl(video: YouTubeVideoItem) {
  const separator = video.embedUrl.includes("?") ? "&" : "?";
  return `${video.embedUrl}${separator}autoplay=1`;
}

function dedupeVideos(videos: YouTubeVideoItem[]) {
  const seen = new Set<string>();

  return videos.filter((video) => {
    if (seen.has(video.id)) return false;
    seen.add(video.id);
    return true;
  });
}

async function fetchVideoPage(pageToken?: string) {
  const params = new URLSearchParams({ maxResults: String(MAX_RESULTS) });
  if (pageToken) params.set("pageToken", pageToken);

  const response = await fetch(`/api/youtube/videos?${params.toString()}`);
  const json = (await response.json()) as ApiResponse;

  if (!response.ok || !json.data) {
    throw new Error(json.error || "Could not load videos right now.");
  }

  return json.data;
}

function VideoCard({
  video,
  isShort,
  onSelect,
}: {
  video: YouTubeVideoItem;
  isShort: boolean;
  onSelect: (video: YouTubeVideoItem) => void;
}) {
  const publishedAt = formatDate(video.publishedAt);

  return (
    <button
      type="button"
      className={`${styles.card} ${isShort ? styles.shortCard : ""}`}
      onClick={() => onSelect(video)}
      aria-label={`Play ${video.title}`}
    >
      <span className={styles.thumbnail}>
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            sizes={isShort ? "(max-width: 640px) 50vw, 25vw" : "(max-width: 820px) 100vw, 33vw"}
            className={styles.thumbnailImage}
          />
        ) : (
          <span className={styles.thumbnailFallback} />
        )}
        <span className={styles.playMark}>
          <PlayIcon />
        </span>
      </span>
      <span className={styles.cardCopy}>
        {publishedAt ? <span className={styles.date}>{publishedAt}</span> : null}
        <span className={styles.cardTitle}>{video.title}</span>
        {video.description ? (
          <span className={styles.description}>
            {truncate(video.description, isShort ? 86 : 130)}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function StatusPanel({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "error";
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.status} ${tone === "error" ? styles.error : ""}`} role="status">
      {children}
    </div>
  );
}

export function YouTubeVideoBrowser() {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [status, setStatus] = useState<BrowserStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);
  const [activeTab, setActiveTab] = useState<VideoTab>("videos");

  useEffect(() => {
    let ignore = false;

    async function loadInitialVideos() {
      try {
        const data = await fetchVideoPage();
        if (ignore) return;

        setVideos(dedupeVideos(data.videos));
        setNextPageToken(data.nextPageToken ?? null);
        setStatus("idle");
      } catch (error) {
        if (ignore) return;

        setErrorMessage((error as Error).message);
        setStatus("error");
      }
    }

    void loadInitialVideos();

    return () => {
      ignore = true;
    };
  }, []);

  const loadMoreVideos = useCallback(async () => {
    if (!nextPageToken) return;

    setIsLoadingMore(true);
    setLoadMoreError("");

    try {
      const data = await fetchVideoPage(nextPageToken);
      setVideos((currentVideos) => dedupeVideos([...currentVideos, ...data.videos]));
      setNextPageToken(data.nextPageToken ?? null);
      setStatus("idle");
    } catch (error) {
      setLoadMoreError((error as Error).message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageToken]);

  useEffect(() => {
    if (!selectedVideo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedVideo(null);
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedVideo]);

  const { regularVideos, shorts } = useMemo(
    () => ({
      regularVideos: videos.filter((video) => video.format !== "short"),
      shorts: videos.filter((video) => video.format === "short"),
    }),
    [videos],
  );

  const activeVideos = activeTab === "videos" ? regularVideos : shorts;
  const isShortsTab = activeTab === "shorts";
  const tabPanelId = `youtube-${activeTab}-panel`;
  const emptyMessage =
    activeTab === "videos"
      ? "No videos found in the latest uploads."
      : "No Shorts found in the latest uploads.";

  return (
    <section className={styles.section} id="video-browser">
      <div className={styles.inner}>
        <div className="section-heading" aria-hidden="true" style={{ visibility: "hidden" }}>
          <div>
            <h2>Latest Uploads</h2>
          </div>
        </div>

        {status === "loading" ? (
          <div className={styles.loadingShell} aria-live="polite">
            <StatusPanel>Loading videos...</StatusPanel>
            <div className={styles.skeletonGrid} aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span className={styles.skeletonCard} key={index} />
              ))}
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <StatusPanel tone="error">
            <span>{errorMessage}</span>
            <a href="https://www.youtube.com/@lucapisanumusic" target="_blank" rel="noreferrer">
              Open YouTube channel
            </a>
          </StatusPanel>
        ) : null}

        {status === "idle" && videos.length === 0 ? (
          <StatusPanel>No videos found.</StatusPanel>
        ) : null}

        {status === "idle" && videos.length > 0 ? (
          <div className={styles.tabShell}>
            <div className={styles.tabList} role="tablist" aria-label="YouTube video formats">
              <button
                type="button"
                id="youtube-videos-tab"
                role="tab"
                aria-selected={activeTab === "videos"}
                aria-controls="youtube-videos-panel"
                className={`${styles.tabButton} ${activeTab === "videos" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("videos")}
              >
                Videos <span>{regularVideos.length}</span>
              </button>
              <button
                type="button"
                id="youtube-shorts-tab"
                role="tab"
                aria-selected={activeTab === "shorts"}
                aria-controls="youtube-shorts-panel"
                className={`${styles.tabButton} ${activeTab === "shorts" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("shorts")}
              >
                Shorts <span>{shorts.length}</span>
              </button>
            </div>

            <div
              className={styles.tabPanel}
              id={tabPanelId}
              role="tabpanel"
              aria-labelledby={`youtube-${activeTab}-tab`}
            >
              {activeVideos.length > 0 ? (
                <div className={`${styles.grid} ${isShortsTab ? styles.shortsGrid : ""}`}>
                  {activeVideos.map((video) => (
                    <VideoCard
                      video={video}
                      isShort={isShortsTab}
                      key={video.id}
                      onSelect={setSelectedVideo}
                    />
                  ))}
                </div>
              ) : (
                <StatusPanel>{emptyMessage}</StatusPanel>
              )}
            </div>

            {nextPageToken ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.moreButton}
                  disabled={isLoadingMore}
                  onClick={() => void loadMoreVideos()}
                >
                  {isLoadingMore ? "Loading..." : "Show More"}
                </button>
              </div>
            ) : null}

            {loadMoreError ? <StatusPanel tone="error">{loadMoreError}</StatusPanel> : null}
          </div>
        ) : null}
      </div>

      {selectedVideo ? (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`video-modal-title-${selectedVideo.id}`}
        >
          <button
            type="button"
            onClick={() => setSelectedVideo(null)}
            aria-label="Close video player"
            className={styles.modalBackdrop}
          />
          <div className={styles.modalPanel}>
            <div className={styles.modalHeader}>
              <h2 id={`video-modal-title-${selectedVideo.id}`}>{selectedVideo.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className={styles.closeButton}
              >
                Close
              </button>
            </div>
            <div className={styles.player}>
              <iframe
                src={getEmbedUrl(selectedVideo)}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className={styles.modalFooter}>
              <p>{formatDate(selectedVideo.publishedAt)}</p>
              <a href={selectedVideo.videoUrl} target="_blank" rel="noreferrer">
                Watch on YouTube
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
