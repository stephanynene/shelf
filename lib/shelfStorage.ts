import type { ShelfData } from "@/types/shelf";

export const SHELF_STORAGE_KEY = "shelf-data";
/** Previous successful JSON blob; used if the primary key is corrupted or truncated. */
export const SHELF_STORAGE_BACKUP_KEY = "shelf-data-backup";

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
  if (raw) {
    const parsed = safeParse(raw);
    if (parsed) return parsed;
  }
  const bak = window.localStorage.getItem(SHELF_STORAGE_BACKUP_KEY);
  if (bak) return safeParse(bak);
  return null;
}

export function saveShelfToStorage(data: ShelfData): void {
  if (typeof window === "undefined") return;
  const next = JSON.stringify(data);
  try {
    const prev = window.localStorage.getItem(SHELF_STORAGE_KEY);
    if (prev && prev !== next) {
      try {
        window.localStorage.setItem(SHELF_STORAGE_BACKUP_KEY, prev);
      } catch {
        /* ignore backup failure (quota, private mode) */
      }
    }
    window.localStorage.setItem(SHELF_STORAGE_KEY, next);
  } catch {
    /* ignore primary write failure (quota, private mode) */
  }
}
