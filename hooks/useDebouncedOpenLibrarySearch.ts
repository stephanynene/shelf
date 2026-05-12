"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  docToShelfCandidate,
  searchOpenLibraryByTitle,
  type OpenLibrarySearchDoc,
} from "@/lib/openLibrary";

export type SearchHit = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  raw: OpenLibrarySearchDoc;
};

const DEBOUNCE_MS = 400;

export function useDebouncedOpenLibrarySearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const seq = useRef(0);

  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }

    const ac = new AbortController();
    const id = ++seq.current;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await searchOpenLibraryByTitle(q, ac.signal);
        if (id !== seq.current) return;
        const next: SearchHit[] = [];
        for (const doc of data.docs ?? []) {
          const c = docToShelfCandidate(doc);
          if (c) next.push({ ...c, raw: doc });
        }
        setHits(next);
      } catch (e) {
        if (ac.signal.aborted || id !== seq.current) return;
        setError(e instanceof Error ? e.message : "Search failed");
        setHits([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [debouncedQuery]);

  const clear = useCallback(() => {
    setQuery("");
    setHits([]);
    setError(null);
  }, []);

  return useMemo(
    () => ({ query, setQuery, loading, error, hits, clear }),
    [query, loading, error, hits, clear],
  );
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
