"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BookPosition, ShelfBook, ShelfData } from "@/types/shelf";
import { isBackgroundId } from "@/lib/backgrounds";
import { loadShelfFromStorage, saveShelfToStorage } from "@/lib/shelfStorage";
import type { SearchHit } from "@/hooks/useDebouncedOpenLibrarySearch";
import { BackgroundLayer } from "./BackgroundLayer";
import { BackgroundPicker } from "./BackgroundPicker";
import { BookModal } from "./BookModal";
import { AddBookSheet } from "./AddBookSheet";
import type { BoardPlacementGet } from "./ShelfCanvas";
import { ShelfCanvas } from "./ShelfCanvas";

function normalizeShelfData(data: ShelfData): ShelfData {
  const background = isBackgroundId(data.background) ? data.background : "forest";
  const rawBooks = Array.isArray(data.books) ? data.books : [];
  const books: ShelfBook[] = [];
  for (const raw of rawBooks) {
    if (!raw || typeof raw !== "object") continue;
    const b = raw as Partial<ShelfBook>;
    if (typeof b.id !== "string" || !b.id.trim()) continue;
    if (typeof b.coverUrl !== "string" || !b.coverUrl.trim()) continue;
    books.push({
      id: b.id,
      title: typeof b.title === "string" ? b.title : "Untitled",
      author: typeof b.author === "string" ? b.author : "Unknown author",
      coverUrl: b.coverUrl,
      monthRead: typeof b.monthRead === "string" ? b.monthRead : "",
      rating:
        typeof b.rating === "number" && Number.isFinite(b.rating)
          ? Math.min(5, Math.max(0, Math.round(b.rating)))
          : 0,
      thought: typeof b.thought === "string" ? b.thought : "",
      summary: typeof b.summary === "string" && b.summary.trim() ? b.summary : undefined,
      layerRank:
        typeof b.layerRank === "number" && Number.isFinite(b.layerRank) && b.layerRank >= 0
          ? Math.floor(b.layerRank)
          : undefined,
      position: {
        x: Number(b.position?.x) || 0,
        y: Number(b.position?.y) || 0,
        rotation:
          typeof b.position?.rotation === "number" && !Number.isNaN(b.position.rotation)
            ? b.position.rotation
            : Math.round((Math.random() * 6 - 3) * 10) / 10,
      },
    });
  }
  return { background, books };
}

function randomTilt(): number {
  return Math.round((Math.random() * 6 - 3) * 10) / 10;
}

export function ShelfClient({ initial }: { initial: ShelfData }) {
  const [data, setData] = useState<ShelfData>(() => normalizeShelfData(initial));
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<ShelfBook | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteBinHot, setDeleteBinHot] = useState(false);
  const [backgroundMenuOpen, setBackgroundMenuOpen] = useState(false);
  const placementRef = useRef<BoardPlacementGet | null>(null);
  const deleteBinRef = useRef<HTMLDivElement>(null);

  const hydratedRef = useRef(false);

  const dataRef = useRef(data);
  dataRef.current = data;
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = loadShelfFromStorage();
      if (stored) {
        const normalized = normalizeShelfData(stored);
        const storedEmpty = normalized.books.length === 0;
        const seedHasBooks = initial.books.length > 0;
        if (storedEmpty && seedHasBooks) {
          const recovered = normalizeShelfData({
            background: normalized.background,
            books: initial.books,
          });
          setData(recovered);
          saveShelfToStorage(recovered);
        } else {
          setData(normalized);
        }
      }
    } catch {
      const fallback = normalizeShelfData(initial);
      setData(fallback);
      try {
        saveShelfToStorage(fallback);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, [initial]);

  useEffect(() => {
    if (!backgroundMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBackgroundMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [backgroundMenuOpen]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      saveShelfToStorage(dataRef.current);
    }, 450);
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [data, hydrated]);

  const saveBookDetails = useCallback((id: string, rating: number, thought: string) => {
    setData((d) => {
      const next: ShelfData = {
        ...d,
        books: d.books.map((b) =>
          b.id === id ? { ...b, rating: Math.min(5, Math.max(0, Math.round(rating))), thought } : b,
        ),
      };
      if (hydratedRef.current) saveShelfToStorage(next);
      return next;
    });
  }, []);

  const setBackground = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      background: isBackgroundId(id) ? id : d.background,
    }));
  }, []);

  const pickBackground = useCallback(
    (id: string) => {
      setBackground(id);
      setBackgroundMenuOpen(false);
    },
    [setBackground],
  );

  const moveBook = useCallback((id: string, position: BookPosition) => {
    setData((d) => ({
      ...d,
      books: d.books.map((b) => (b.id === id ? { ...b, position } : b)),
    }));
  }, []);

  const promoteBookLayer = useCallback((id: string) => {
    setData((d) => {
      const maxRank = d.books.reduce((m, b) => Math.max(m, b.layerRank ?? 0), 0);
      const next = maxRank + 1;
      return {
        ...d,
        books: d.books.map((b) => (b.id === id ? { ...b, layerRank: next } : b)),
      };
    });
  }, []);

  const removeBook = useCallback((id: string) => {
    setData((d) => ({ ...d, books: d.books.filter((b) => b.id !== id) }));
    setSelected((s) => (s?.id === id ? null : s));
  }, []);

  const handleDeleteBinHover = useCallback((active: boolean) => {
    setDeleteBinHot(active);
  }, []);

  const addBookFromHit = useCallback((hit: SearchHit) => {
    setData((d) => {
      let id = hit.id;
      if (d.books.some((b) => b.id === id)) {
        id = `${hit.id}_${Date.now()}`;
      }
      const maxRank = d.books.reduce((m, b) => Math.max(m, b.layerRank ?? 0), 0);
      const place = placementRef.current?.() ?? { x: 0, y: 0 };
      const book: ShelfBook = {
        id,
        title: hit.title,
        author: hit.author,
        coverUrl: hit.coverUrl,
        monthRead: new Date().toISOString().slice(0, 7),
        rating: 5,
        thought: "",
        layerRank: maxRank + 1,
        position: { x: place.x, y: place.y, rotation: randomTilt() },
      };
      return { ...d, books: [...d.books, book] };
    });
  }, []);

  const exportBlob = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const downloadShelfJson = useCallback(() => {
    const blob = new Blob([exportBlob], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportBlob]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f0e6] text-[#2c2418]">
      <BackgroundLayer backgroundId={data.background} />

      <div className="relative z-0 h-dvh w-full">
        <ShelfCanvas
          books={data.books}
          deleteBinRef={deleteBinRef}
          onBookOpen={setSelected}
          onBookMove={moveBook}
          onBookDragEnd={promoteBookLayer}
          onBookDelete={removeBook}
          onDeleteBinHover={handleDeleteBinHover}
          placementRef={placementRef}
        />
      </div>

      {/* Full-screen pass-through layer: only explicit children receive clicks (avoids pan/zoom stealing toolbar hits). */}
      <div className="pointer-events-none fixed inset-0 z-[70] isolate">
        {backgroundMenuOpen ? (
          <button
            type="button"
            className="shelf-no-pan pointer-events-auto absolute inset-0 z-0 cursor-default bg-[#2c2418]/20 backdrop-blur-[1px]"
            aria-label="Close background menu"
            onClick={() => setBackgroundMenuOpen(false)}
          />
        ) : null}
        <div className="shelf-no-pan pointer-events-auto absolute bottom-3 left-3 z-10 flex max-w-[calc(100vw-1.5rem)] flex-col items-start gap-2 sm:bottom-4 sm:left-4">
          {backgroundMenuOpen ? (
            <div className="max-h-[min(50vh,22rem)] overflow-y-auto overscroll-contain rounded-xl shadow-lg ring-1 ring-[#2c2418]/10">
              <BackgroundPicker currentId={data.background} onSelect={pickBackground} />
            </div>
          ) : null}
          <div className="flex items-end gap-1.5">
            <div
              ref={deleteBinRef}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border shadow-sm transition ${
                deleteBinHot
                  ? "border-rose-400/85 bg-rose-50/95 ring-2 ring-rose-400/55"
                  : "border-[#c9bdad]/75 bg-[#fdfaf5]/93 backdrop-blur-sm"
              }`}
              aria-label="Trash — drag a book here and release to remove it from the shelf"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-[#5c5246] ${deleteBinHot ? "text-rose-600" : ""}`}
                aria-hidden
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
            </div>
            <button
              type="button"
              onClick={() => setBackgroundMenuOpen((o) => !o)}
              className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md border border-[#c9bdad]/75 bg-[#fdfaf5]/93 shadow-sm backdrop-blur-sm transition hover:bg-[#efe8dd]"
              aria-expanded={backgroundMenuOpen}
              aria-label="Choose background"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-[#5c5246]"
                aria-hidden
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>

        <div className="shelf-no-pan pointer-events-auto absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5 sm:bottom-4 sm:right-4">
          <button
            type="button"
            onClick={downloadShelfJson}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9bdad]/75 bg-[#fdfaf5]/93 shadow-sm backdrop-blur-sm transition hover:bg-[#efe8dd]"
            aria-label="Download shelf as books.json for the repo"
            title="Save as books.json — replace data/books.json in your project"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#5c5246]"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9bdad]/75 bg-[#fdfaf5]/93 text-xl font-light leading-none text-[#3d3428] shadow-sm backdrop-blur-sm transition hover:bg-[#efe8dd]"
            onClick={() => setAddOpen(true)}
            aria-label="Add book"
          >
            +
          </button>
        </div>
      </div>

      <AddBookSheet open={addOpen} onClose={() => setAddOpen(false)} onPick={addBookFromHit} />

      {selected ? (
        <BookModal
          key={selected.id}
          book={selected}
          onClose={() => setSelected(null)}
          onSave={saveBookDetails}
        />
      ) : null}
    </div>
  );
}
