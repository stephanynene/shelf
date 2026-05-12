export type OpenLibrarySearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export type OpenLibrarySearchResponse = {
  numFound?: number;
  docs?: OpenLibrarySearchDoc[];
};

export function openLibraryCoverUrl(coverId: number, size: "S" | "M" | "L" = "M"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

/** Use the largest Open Library cover for modals / large displays (avoids upscaled blur). */
export function openLibraryCoverUrlForDetail(coverUrl: string): string {
  if (!coverUrl.includes("covers.openlibrary.org")) return coverUrl;
  return coverUrl.replace(/-([sSmMlL])\.(jpe?g|png)(\?[^#]*)?$/i, (_m, _size, ext, query = "") => `-L.${ext}${query}`);
}

export function docToShelfCandidate(doc: OpenLibrarySearchDoc): {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
} | null {
  if (!doc.key || !doc.title) return null;
  const workId = doc.key.replace(/^\/works\//, "").replace(/^\/books\//, "");
  if (!workId) return null;
  const coverUrl =
    doc.cover_i != null ? openLibraryCoverUrl(doc.cover_i, "M") : "/placeholder-cover.svg";
  return {
    id: `ol_${workId}`,
    title: doc.title,
    author: doc.author_name?.[0] ?? "Unknown author",
    coverUrl,
  };
}

export function openLibraryWorkKeyFromShelfId(bookId: string): string | null {
  if (!bookId.startsWith("ol_")) return null;
  const key = bookId.slice(3).trim();
  return key || null;
}

/** Plain-text excerpt from Open Library work record (HTML stripped, length capped). */
export async function fetchOpenLibraryWorkSummary(
  shelfBookId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const wid = openLibraryWorkKeyFromShelfId(shelfBookId);
  if (!wid) return null;
  const res = await fetch(`https://openlibrary.org/works/${encodeURIComponent(wid)}.json`, {
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    description?: string | { value?: string };
  };
  const raw = data.description;
  let text: string | undefined;
  if (typeof raw === "string") text = raw;
  else if (raw && typeof raw === "object" && typeof raw.value === "string") text = raw.value;
  if (!text) return null;
  const plain = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  const max = 420;
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
}

export async function searchOpenLibraryByTitle(
  title: string,
  signal?: AbortSignal,
): Promise<OpenLibrarySearchResponse> {
  const q = title.trim();
  if (!q) return { docs: [] };
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", q);
  url.searchParams.set("limit", "12");
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error(`Open Library search failed (${res.status})`);
  return (await res.json()) as OpenLibrarySearchResponse;
}
