export const BACKGROUND_IDS = [
  "venice",
  "acropolis",
  "forest",
  "colosseum",
  "library",
  "ocean",
] as const;

export type BackgroundId = (typeof BACKGROUND_IDS)[number];

export function backgroundSrc(id: string): string {
  return `/backgrounds/${id}.png`;
}

export function isBackgroundId(id: string): id is BackgroundId {
  return (BACKGROUND_IDS as readonly string[]).includes(id);
}
