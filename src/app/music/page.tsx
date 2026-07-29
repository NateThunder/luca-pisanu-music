import type { Metadata } from "next";
import { MusicExperience } from "@/components/MusicExperience";
import { Reveal } from "@/components/Reveal";
import { getMusicReleases } from "@/lib/music-data";

export const metadata: Metadata = {
  title: "Music",
  description:
    "Explore music by Luca Pisanu: soulful songwriting, expressive guitars and deep grooves.",
};

export const dynamic = "force-dynamic";

export default async function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ play?: string | string[] }>;
}) {
  const releases = await getMusicReleases();
  if (!releases.length) return null;
  const requestedPlay = (await searchParams).play;
  const initialReleaseId = Array.isArray(requestedPlay) ? requestedPlay[0] : requestedPlay;

  return <Reveal><MusicExperience initialReleaseId={initialReleaseId} releases={releases} /></Reveal>;
}
