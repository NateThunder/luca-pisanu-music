import Image from "next/image";
import type { CSSProperties } from "react";
import type { HomePagePicture } from "@/lib/home-page-data";

type CropStyle = CSSProperties & {
  "--crop-desktop-x": string;
  "--crop-desktop-y": string;
  "--crop-desktop-zoom": number;
  "--crop-mobile-x": string;
  "--crop-mobile-y": string;
  "--crop-mobile-zoom": number;
};

export function CroppedImage({
  alt,
  className = "",
  picture,
  preload = false,
  sizes,
}: {
  alt: string;
  className?: string;
  picture: HomePagePicture;
  preload?: boolean;
  sizes: string;
}) {
  const style: CropStyle = {
    "--crop-desktop-x": `${picture.desktop.x}%`,
    "--crop-desktop-y": `${picture.desktop.y}%`,
    "--crop-desktop-zoom": picture.desktop.zoom,
    "--crop-mobile-x": `${picture.mobile.x}%`,
    "--crop-mobile-y": `${picture.mobile.y}%`,
    "--crop-mobile-zoom": picture.mobile.zoom,
  };

  return (
    <Image
      alt={alt}
      className={`cropped-image ${className}`.trim()}
      fill
      preload={preload}
      sizes={sizes}
      src={picture.imageUrl}
      style={style}
      unoptimized={picture.imageUrl.startsWith("/api/")}
    />
  );
}
