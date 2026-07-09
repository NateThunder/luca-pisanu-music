import { getCloudflareContext } from "@opennextjs/cloudflare";
import { releases as fallbackReleases, type Release } from "@/data/site";
import { imageAssetUrl } from "./file-assets";

export type MusicReleaseRow = {
  id: string;
  title: string;
  description: string;
  artwork: Release["artwork"];
  artwork_id: string | null;
  selected_artwork_key: string | null;
  selected_artwork_alt: string | null;
  cover_art_key: string | null;
  audio_key: string | null;
  listen_url: string | null;
  support_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  youtube_url: string | null;
  soundcloud_url: string | null;
  bandcamp_url: string | null;
  sort_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
};

export type AdminMusicRelease = {
  id: string;
  title: string;
  description: string;
  artwork: Release["artwork"];
  artworkId: string | null;
  coverArtKey: string | null;
  audioKey: string | null;
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
  createdAt: string;
  updatedAt: string;
};

export type MusicArtworkRow = {
  id: string;
  title: string;
  image_key: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AdminMusicArtwork = {
  id: string;
  title: string;
  imageKey: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getMusicDatabase() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_DB ?? null;
  } catch {
    return null;
  }
}

export async function getMusicBucket() {
  try {
    const context = await getCloudflareContext({ async: true });
    return context.env.MUSIC_BUCKET ?? null;
  } catch {
    return null;
  }
}

function assetUrl(key: string | null) {
  return imageAssetUrl("/api/music/assets", key);
}

function rowToRelease(row: MusicReleaseRow): Release {
  const audioUrl = assetUrl(row.audio_key);
  const coverArtUrl = assetUrl(row.selected_artwork_key || row.cover_art_key);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    artwork: row.artwork,
    coverArtUrl,
    coverArtAlt: row.selected_artwork_alt,
    audioUrl,
    listenUrl: row.listen_url ?? audioUrl,
    supportUrl: row.support_url,
    streamingLinks: {
      spotify: row.spotify_url,
      appleMusic: row.apple_music_url,
      youtube: row.youtube_url,
      soundcloud: row.soundcloud_url,
      bandcamp: row.bandcamp_url,
    },
  };
}

export function rowToAdminMusicRelease(row: MusicReleaseRow): AdminMusicRelease {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    artwork: row.artwork,
    artworkId: row.artwork_id,
    coverArtKey: row.cover_art_key,
    audioKey: row.audio_key,
    coverArtUrl: assetUrl(row.selected_artwork_key || row.cover_art_key),
    audioUrl: assetUrl(row.audio_key),
    listenUrl: row.listen_url,
    supportUrl: row.support_url,
    spotifyUrl: row.spotify_url,
    appleMusicUrl: row.apple_music_url,
    youtubeUrl: row.youtube_url,
    soundcloudUrl: row.soundcloud_url,
    bandcampUrl: row.bandcamp_url,
    sortOrder: row.sort_order,
    isVisible: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToAdminMusicArtwork(row: MusicArtworkRow): AdminMusicArtwork {
  return {
    id: row.id,
    title: row.title,
    imageKey: row.image_key,
    imageUrl: assetUrl(row.image_key) ?? "",
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getMusicReleases() {
  const db = await getMusicDatabase();
  if (!db) return fallbackReleases;

  try {
    const result = await db
      .prepare(
        `SELECT music_releases.id,
                music_releases.title,
                music_releases.description,
                music_releases.artwork,
                music_releases.artwork_id,
                music_artworks.image_key AS selected_artwork_key,
                music_artworks.alt_text AS selected_artwork_alt,
                music_releases.cover_art_key,
                music_releases.audio_key,
                music_releases.listen_url,
                music_releases.support_url,
                music_releases.spotify_url,
                music_releases.apple_music_url,
                music_releases.youtube_url,
                music_releases.soundcloud_url,
                music_releases.bandcamp_url,
                music_releases.sort_order,
                music_releases.is_published,
                music_releases.created_at,
                music_releases.updated_at
         FROM music_releases
         LEFT JOIN music_artworks ON music_artworks.id = music_releases.artwork_id
         WHERE music_releases.is_published = 1
         ORDER BY music_releases.sort_order ASC, music_releases.title ASC`,
      )
      .all<MusicReleaseRow>();

    const dbReleases = (result.results ?? []).map(rowToRelease);
    return dbReleases.length > 0 ? dbReleases : fallbackReleases;
  } catch {
    return fallbackReleases;
  }
}
