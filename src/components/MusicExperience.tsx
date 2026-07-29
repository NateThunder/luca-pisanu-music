"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Release } from "@/data/site";
import { getMusicAudio } from "@/lib/music-audio";
import { ReleaseArtwork } from "./ReleaseArtwork";
import { ReleaseList } from "./ReleaseList";
import { SupportTrackButton } from "./shop/SupportTrackButton";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function MusicExperience({
  initialReleaseId,
  releases,
}: {
  initialReleaseId?: string;
  releases: Release[];
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Release | null>(null);
  const [selected, setSelected] = useState<Release | null>(null);
  const [category, setCategory] = useState<"ALL" | "ALBUM" | "EP" | "SINGLE">("ALL");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const mainRelease = selected ?? current ?? releases.find((release) => release.isAvailable !== false) ?? releases[0];
  const visibleReleases = category === "ALL" ? releases : releases.filter((release) => (release.releaseType ?? "SINGLE") === category);

  useEffect(() => {
    const audio = getMusicAudio();
    audioRef.current = audio;

    function updateDuration() {
      setDuration(audio.duration || 0);
    }

    function updateTime() {
      setCurrentTime(audio.currentTime);
    }

    function markPlaying() {
      setIsPlaying(true);
    }

    function markPaused() {
      setIsPlaying(false);
    }

    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("play", markPlaying);
    audio.addEventListener("pause", markPaused);
    audio.addEventListener("ended", markPaused);

    const requested = releases.find(
      (release) => release.id === initialReleaseId && release.audioUrl,
    );
    const active = requested ?? releases.find((release) => {
      if (!release.audioUrl || !audio.src) return false;
      return new URL(release.audioUrl, window.location.href).href === audio.src;
    });

    let syncTimeout: number | undefined;
    if (active?.audioUrl) {
      const activeSource = new URL(active.audioUrl, window.location.href).href;
      if (audio.src !== activeSource) {
        audio.src = active.audioUrl;
        audio.currentTime = 0;
      }
      syncTimeout = window.setTimeout(() => {
        setCurrent(active);
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration || 0);
        setVolume(audio.muted ? 0 : audio.volume);
        setIsPlaying(!audio.paused);
      }, 0);
    }

    return () => {
      if (syncTimeout !== undefined) window.clearTimeout(syncTimeout);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("play", markPlaying);
      audio.removeEventListener("pause", markPaused);
      audio.removeEventListener("ended", markPaused);
      audio.pause();
      audioRef.current = null;
    };
  }, [initialReleaseId, releases]);

  if (!mainRelease) return null;

  async function selectOrToggle(release: Release) {
    setSelected(release);
    if (release.isAvailable === false) return;
    const audio = audioRef.current;
    if (!audio || !release.audioUrl) return;

    if (current?.id !== release.id) {
      audio.src = release.audioUrl;
      audio.currentTime = 0;
      setCurrent(release);
      setCurrentTime(0);
      setDuration(0);
    } else if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setIsPlaying(false);
    }
  }

  function closePlayer() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrent(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    audio.muted = false;
    setVolume(value);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setVolume(audio.muted ? 0 : audio.volume);
  }

  return (
    <div className={current ? "music-experience has-open-player" : "music-experience"}>
      <section className="featured-release poster-section">
        <div className="featured-release__art" key={`art-${mainRelease.id}`}>
          <ReleaseArtwork
            isPlaying={current?.id === mainRelease.id && isPlaying}
            onPlay={mainRelease.audioUrl ? () => void selectOrToggle(mainRelease) : undefined}
            release={mainRelease}
          />
        </div>
        <div className="featured-release__copy" key={`copy-${mainRelease.id}`}>
          <span className="eyebrow">{mainRelease.isAvailable === false ? "Coming soon" : current?.id === mainRelease.id ? "Now playing" : "Featured release"}</span>
          <h2>{mainRelease.title}</h2>
          <p>{mainRelease.description}</p>
          <div className="hero-actions">
            {mainRelease.isAvailable !== false && mainRelease.audioUrl ? (
              <button
                className="action-link action-link--primary"
                onClick={() => void selectOrToggle(mainRelease)}
                type="button"
              >
                {current?.id === mainRelease.id && isPlaying ? "Pause" : "Listen"}
              </button>
            ) : null}
            {mainRelease.isAvailable !== false && mainRelease.isForSale && mainRelease.purchaseProductId && mainRelease.purchasePrices
              ? <SupportTrackButton productId={mainRelease.purchaseProductId} title={mainRelease.title} prices={mainRelease.purchasePrices} />
              : <span className="music-coming-soon">Coming soon</span>}
          </div>
        </div>
      </section>

      <section className="catalogue poster-section">
        <div className="section-heading">
          <div><h2>The Catalogue</h2></div>
        </div>
        <nav className="music-category-nav" aria-label="Music categories">
          {(["ALL", "ALBUM", "EP", "SINGLE"] as const).map((item) => <button className={category === item ? "is-active" : ""} key={item} onClick={() => setCategory(item)} type="button">{item === "ALL" ? "All" : item === "ALBUM" ? "Albums" : item === "EP" ? "EPs" : "Singles"}</button>)}
        </nav>
        <ReleaseList
          activeReleaseId={isPlaying ? current?.id : null}
          items={visibleReleases}
          onPlay={(release) => void selectOrToggle(release)}
          onSelect={setSelected}
        />
      </section>

      {current ? (
        <aside aria-label="Music player" className="music-player">
          <div className="music-player__track">
            <span className="music-player__index" aria-hidden="true">PLAYING</span>
            <div>
              <strong>{current.title}</strong>
              <span>{current.description}</span>
            </div>
          </div>
          <button
            aria-label={isPlaying ? `Pause ${current.title}` : `Play ${current.title}`}
            className="music-player__play"
            onClick={() => void selectOrToggle(current)}
            type="button"
          >
            {isPlaying ? (
              <span className="music-player__pause-icon" aria-hidden="true" />
            ) : (
              <span className="music-player__play-icon" aria-hidden="true" />
            )}
          </button>
          <div className="music-player__timeline">
            <span>{formatTime(currentTime)}</span>
            <input
              aria-label="Track position"
              max={duration || 0}
              min="0"
              onChange={(event) => seek(Number(event.target.value))}
              step="0.1"
              style={{ "--player-progress": `${duration ? (currentTime / duration) * 100 : 0}%` } as CSSProperties}
              type="range"
              value={Math.min(currentTime, duration || 0)}
            />
            <span>{formatTime(duration)}</span>
          </div>
          <div className="music-player__volume">
            <button aria-label={volume === 0 ? "Unmute" : "Mute"} onClick={toggleMute} type="button">
              {volume === 0 ? "MUTE" : "VOL"}
            </button>
            <input
              aria-label="Volume"
              max="1"
              min="0"
              onChange={(event) => changeVolume(Number(event.target.value))}
              step="0.05"
              type="range"
              value={volume}
            />
          </div>
          <button aria-label="Close music player" className="music-player__close" onClick={closePlayer} type="button">
            CLOSE ×
          </button>
        </aside>
      ) : null}
    </div>
  );
}
