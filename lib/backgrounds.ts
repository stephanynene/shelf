export const BACKGROUND_IDS = [
  "linen",
  "forest",
  "library",
  "cafe",
  "bedroom",
  "desk",
  "sunset",
  "ocean",
  "study",
  "attic",
  "garden",
] as const;

export type BackgroundId = (typeof BACKGROUND_IDS)[number];

export function backgroundSrc(id: string): string {
  return `/backgrounds/${id}.jpg`;
}

export function isBackgroundId(id: string): id is BackgroundId {
  return (BACKGROUND_IDS as readonly string[]).includes(id);
}
