"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const books = data.books.map((b) => ({
    ...b,
    position: {
      x: Number(b.position?.x) || 0,
      y: Number(b.position?.y) || 0,
      rotation:
        typeof b.position?.rotation === "number" && !Number.isNaN(b.position.rotation)
          ? b.position.rotation
          : Math.round((Math.random() * 6 - 3) * 10) / 10,
    },
  }));
  return { background, books };
}

function randomTilt(): number {
  return Math.round((Math.random() * 6 - 3) * 10) / 10;
}

function getEditSecret(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SHELF_EDIT_KEY?.trim();
  if (fromEnv) return fromEnv;
  // Local dev: no .env yet — use http://localhost:3000/shelf?edit=dev
  if (process.env.NODE_ENV === "development") return "dev";
  return "";
}

export function ShelfClient({ initial }: { initial: ShelfData }) {
  const searchParams = useSearchParams();
  const editSecret = getEditSecret();
  const isEditMode = Boolean(editSecret && searchParams.get("edit") === editSecret);

  const [data, setData] = useState<ShelfData>(() => normalizeShelfData(initial));
  const [hydrated, setHydrated] = useState(false);
  const [selected, setSelected] = useState<ShelfBook | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const placementRef = useRef<BoardPlacementGet | null>(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
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
    setHydrated(true);
  }, [initial]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !isEditMode) return;
    saveShelfToStorage(data);
  }, [data, hydrated, isEditMode]);

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

  const moveBook = useCallback((id: string, position: BookPosition) => {
    setData((d) => ({
      ...d,
      books: d.books.map((b) => (b.id === id ? { ...b, position } : b)),
    }));
  }, []);

  const addBookFromHit = useCallback((hit: SearchHit) => {
    setData((d) => {
      let id = hit.id;
      if (d.books.some((b) => b.id === id)) {
        id = `${hit.id}_${Date.now()}`;
      }
      const place = placementRef.current?.() ?? { x: 0, y: 0 };
      const book: ShelfBook = {
        id,
        title: hit.title,
        author: hit.author,
        coverUrl: hit.coverUrl,
        monthRead: new Date().toISOString().slice(0, 7),
        rating: 5,
        thought: "",
        position: { x: place.x, y: place.y, rotation: randomTilt() },
      };
      return { ...d, books: [...d.books, book] };
    });
  }, []);

  const exportBlob = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const downloadExport = useCallback(() => {
    const blob = new Blob([exportBlob], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "books.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportBlob]);

  const copyExport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportBlob);
    } catch {
      /* ignore */
    }
  }, [exportBlob]);

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f6f0e6] text-[#2c2418]">
      <BackgroundLayer backgroundId={data.background} />

      <div className="relative z-10 h-dvh w-full">
        <ShelfCanvas
          books={data.books}
          isEditMode={isEditMode}
          onBookOpen={setSelected}
          onBookMove={moveBook}
          placementRef={placementRef}
        />
      </div>

      {isEditMode ? (
        <div className="pointer-events-none shelf-no-pan fixed left-0 right-0 top-0 z-20 flex justify-center p-3">
          <p className="pointer-events-auto rounded-full border border-[#c9bdad]/80 bg-[#fdfaf5]/90 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[#5c5246] shadow-sm backdrop-blur-sm">
            Edit mode · drag covers · add books · pick a surface
          </p>
        </div>
      ) : null}

      {isEditMode ? (
        <div className="shelf-no-pan fixed right-6 top-20 z-30 flex flex-col gap-2 sm:top-24">
          <button
            type="button"
            onClick={copyExport}
            className="rounded-full border border-[#c9bdad]/90 bg-[#fdfaf5]/92 px-4 py-2 text-sm font-medium text-[#3d3428] shadow-md backdrop-blur-sm hover:bg-[#f5efe6]"
          >
            Copy JSON
          </button>
          <button
            type="button"
            onClick={downloadExport}
            className="rounded-full border border-[#c9bdad]/90 bg-[#fdfaf5]/92 px-4 py-2 text-sm font-medium text-[#3d3428] shadow-md backdrop-blur-sm hover:bg-[#f5efe6]"
          >
            Download books.json
          </button>
        </div>
      ) : null}

      {isEditMode ? <BackgroundPicker currentId={data.background} onSelect={setBackground} /> : null}

      {isEditMode ? (
        <button
          type="button"
          className="shelf-no-pan fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9bdad]/90 bg-[#3d3428] text-2xl font-light text-[#fdfaf5] shadow-lg transition hover:bg-[#2a241c]"
          onClick={() => setAddOpen(true)}
          aria-label="Add book"
        >
          +
        </button>
      ) : null}

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
