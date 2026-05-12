import type { ShelfData } from "@/types/shelf";

export const SHELF_STORAGE_KEY = "shelf-data";

function safeParse(json: string): ShelfData | null {
  try {
    const v = JSON.parse(json) as ShelfData;
    if (!v || typeof v !== "object") return null;
    if (typeof v.background !== "string" || !Array.isArray(v.books)) return null;
    return v;
  } catch {
    return null;
  }
}

export function loadShelfFromStorage(): ShelfData | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SHELF_STORAGE_KEY);
  if (!raw) return null;
  return safeParse(raw);
}

export function saveShelfToStorage(data: ShelfData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHELF_STORAGE_KEY, JSON.stringify(data));
}
