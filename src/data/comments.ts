export type PublicComment = {
  id: string;
  screenName: string;
  body: string;
  createdAt: string;
  source?: "live" | "seed";
};

export type SeedCommentTemplate = {
  id: string;
  screenName: string;
  body: string;
  minutesAgo: number;
};

export const seedCommentTemplates: SeedCommentTemplate[] = [
  {
    id: "seed-marco",
    screenName: "Marco T.",
    body: "Luca's live shows are something else. Raw, intimate and full of soul. You feel every note.",
    minutesAgo: 18,
  },
  {
    id: "seed-giulia",
    screenName: "Giulia R.",
    body: "The songwriting, the tone, the vibe... Everything Luca does is on another level. A true artist.",
    minutesAgo: 55,
  },
  {
    id: "seed-daniel",
    screenName: "Daniel M.",
    body: "A rare mix of groove and honesty. The songs stay with you long after the room goes quiet.",
    minutesAgo: 140,
  },
  {
    id: "seed-sara",
    screenName: "Sara L.",
    body: "Every performance feels personal. Beautiful playing, warm energy and serious musicianship.",
    minutesAgo: 320,
  },
];

export function buildSeedComments(now = Date.now()): PublicComment[] {
  return seedCommentTemplates.map((comment) => ({
    id: comment.id,
    screenName: comment.screenName,
    body: comment.body,
    createdAt: new Date(now - comment.minutesAgo * 60 * 1000).toISOString(),
    source: "seed",
  }));
}
