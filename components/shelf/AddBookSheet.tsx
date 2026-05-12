"use client";

import Image from "next/image";
import { useDebouncedOpenLibrarySearch, type SearchHit } from "@/hooks/useDebouncedOpenLibrarySearch";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (hit: SearchHit) => void;
};

export function AddBookSheet({ open, onClose, onPick }: Props) {
  const { query, setQuery, loading, error, hits, clear } = useDebouncedOpenLibrarySearch();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-[#2c2418]/35 backdrop-blur-[1px]"
        aria-label="Close add book"
        onClick={() => {
          clear();
          onClose();
        }}
      />
      <div className="shelf-no-pan relative z-10 flex max-h-[min(85vh,560px)] w-full max-w-lg flex-col rounded-t-2xl border border-white/50 bg-[#fdfaf5]/97 p-5 shadow-[0_-8px_40px_rgba(44,36,24,0.2)] sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium text-[#1f1810]">Add a book</h2>
            <p className="mt-1 text-sm text-[#6b5e4f]">Search Open Library by title</p>
          </div>
          <button
            type="button"
            className="rounded-full px-3 py-1 text-sm text-[#6b5e4f] hover:bg-[#ebe4d8]"
            onClick={() => {
              clear();
              onClose();
            }}
          >
            Done
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title…"
          className="mb-3 w-full rounded-xl border border-[#ddd4c4] bg-white/80 px-4 py-3 text-[#2c2418] outline-none ring-[#bfa88a]/40 placeholder:text-[#9a8e82] focus:ring-2"
          autoFocus
        />
        {loading ? (
          <p className="text-sm text-[#6b5e4f]">Searching…</p>
        ) : error ? (
          <p className="text-sm text-red-700/90">{error}</p>
        ) : null}
        <ul className="mt-2 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#f0e9de]"
                onClick={() => {
                  onPick(hit);
                  clear();
                  onClose();
                }}
              >
                <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-sm bg-[#e8e2d8] shadow-inner">
                  <Image src={hit.coverUrl} alt="" fill className="object-cover" sizes="44px" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#2c2418]">{hit.title}</p>
                  <p className="truncate text-sm text-[#6b5e4f]">{hit.author}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
        {!loading && query.trim() && hits.length === 0 && !error ? (
          <p className="py-6 text-center text-sm text-[#7a6f62]">No results.</p>
        ) : null}
      </div>
    </div>
  );
}
