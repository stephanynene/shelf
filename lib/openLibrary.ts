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
