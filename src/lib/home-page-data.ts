import { imageAssetUrl } from "./file-assets";
import { getMusicDatabase } from "./music-data";

export type HomeCrop = {
  x: number;
  y: number;
  zoom: number;
};

export type HomePagePicture = {
  imageUrl: string;
  desktop: HomeCrop;
  mobile: HomeCrop;
};

export type HomePageMedia = {
  banner: HomePagePicture;
  connect: HomePagePicture;
};

export type HomePageMediaRow = {
  id: string;
  banner_image_key: string | null;
  banner_desktop_x: number;
  banner_desktop_y: number;
  banner_desktop_zoom: number;
  banner_mobile_x: number;
  banner_mobile_y: number;
  banner_mobile_zoom: number;
  connect_image_key: string | null;
  connect_desktop_x: number;
  connect_desktop_y: number;
  connect_desktop_zoom: number;
  connect_mobile_x: number;
  connect_mobile_y: number;
  connect_mobile_zoom: number;
  created_at: string;
  updated_at: string;
};

export const homePageMediaColumns = `id,
  banner_image_key,
  banner_desktop_x,
  banner_desktop_y,
  banner_desktop_zoom,
  banner_mobile_x,
  banner_mobile_y,
  banner_mobile_zoom,
  connect_image_key,
  connect_desktop_x,
  connect_desktop_y,
  connect_desktop_zoom,
  connect_mobile_x,
  connect_mobile_y,
  connect_mobile_zoom,
  created_at,
  updated_at`;

const fallbackMedia: HomePageMedia = {
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

function picture(
  key: string | null,
  fallback: HomePagePicture,
  desktop: HomeCrop,
  mobile: HomeCrop,
): HomePagePicture {
  return {
    imageUrl: imageAssetUrl("/api/music/assets", key) ?? fallback.imageUrl,
    desktop,
    mobile,
  };
}

export function rowToHomePageMedia(row: HomePageMediaRow | null): HomePageMedia {
  if (!row) return fallbackMedia;

  return {
    banner: picture(
      row.banner_image_key,
      fallbackMedia.banner,
      {
        x: row.banner_desktop_x,
        y: row.banner_desktop_y,
        zoom: row.banner_desktop_zoom,
      },
      {
        x: row.banner_mobile_x,
        y: row.banner_mobile_y,
        zoom: row.banner_mobile_zoom,
      },
    ),
    connect: picture(
      row.connect_image_key,
      fallbackMedia.connect,
      {
        x: row.connect_desktop_x,
        y: row.connect_desktop_y,
        zoom: row.connect_desktop_zoom,
      },
      {
        x: row.connect_mobile_x,
        y: row.connect_mobile_y,
        zoom: row.connect_mobile_zoom,
      },
    ),
  };
}

export async function getHomePageMedia() {
  const db = await getMusicDatabase();
  if (!db) return fallbackMedia;

  try {
    const row = await db
      .prepare(`SELECT ${homePageMediaColumns} FROM home_page_media WHERE id = 'home' LIMIT 1`)
      .first<HomePageMediaRow>();
    return rowToHomePageMedia(row);
  } catch {
    return fallbackMedia;
  }
}
