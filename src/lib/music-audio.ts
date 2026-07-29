import type { Release } from "@/data/site";

let sharedAudio: HTMLAudioElement | null = null;

export function getMusicAudio() {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "metadata";
  }

  return sharedAudio;
}

export function startReleasePlayback(release: Release) {
  if (!release.audioUrl) return Promise.resolve();

  const audio = getMusicAudio();
  const nextSource = new URL(release.audioUrl, window.location.href).href;
  if (audio.src !== nextSource) {
    audio.src = release.audioUrl;
    audio.currentTime = 0;
  }

  return audio.play();
}
