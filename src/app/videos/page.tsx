import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { YouTubeVideoBrowser } from "@/components/videos/YouTubeVideoBrowser";

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Live performances, studio moments and Shorts from Luca Pisanu.",
};

export default function VideosPage() {
  return (
    <>
      <Reveal>
        <YouTubeVideoBrowser />
      </Reveal>
    </>
  );
}
