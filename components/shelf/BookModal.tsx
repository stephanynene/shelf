"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchOpenLibraryWorkSummary, openLibraryCoverUrlForDetail } from "@/lib/openLibrary";
import type { ShelfBook } from "@/types/shelf";

type Props = {
  book: ShelfBook;
  onClose: () => void;
  onSave: (id: string, rating: number, thought: string) => void;
};

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const v = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Rating out of 5">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const filled = n <= v;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(n)}
            className={`min-h-10 min-w-10 rounded-md text-2xl leading-none transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b7355] sm:min-h-11 sm:min-w-11 ${
              filled ? "text-amber-600" : "text-amber-600/25"
            }`}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={filled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function BookModal({ book, onClose, onSave }: Props) {
  const [rating, setRating] = useState(book.rating);
  const [thought, setThought] = useState(book.thought ?? "");
  const [fetchedSummary, setFetchedSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryOverflows, setSummaryOverflows] = useState(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setRating(book.rating);
    setThought(book.thought ?? "");
    setSummaryExpanded(false);
  }, [book]);

  useEffect(() => {
    setFetchedSummary(null);
    const fromJson = book.summary?.trim();
    if (fromJson) return;

    const ac = new AbortController();
    setSummaryLoading(true);
    fetchOpenLibraryWorkSummary(book.id, ac.signal)
      .then((t) => {
        if (!ac.signal.aborted) setFetchedSummary(t);
      })
      .finally(() => {
        if (!ac.signal.aborted) setSummaryLoading(false);
      });

    return () => ac.abort();
  }, [book.id, book.summary]);

  const displaySummary = book.summary?.trim() || fetchedSummary;

  useLayoutEffect(() => {
    if (!displaySummary || summaryLoading) {
      setSummaryOverflows(false);
      return;
    }
    if (summaryExpanded) return;

    const el = summaryRef.current;
    if (!el) return;

    const measure = () => {
      const node = summaryRef.current;
      if (!node) return;
      setSummaryOverflows(node.scrollHeight > node.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [displaySummary, summaryExpanded, summaryLoading]);

  const handleSave = () => {
    onSave(book.id, rating, thought.trim());
    onClose();
  };

  /** Same URL as the canvas card first (HTTP cache hit), then optional OL `-L` swap when preloaded. */
  const coverHiRes = openLibraryCoverUrlForDetail(book.coverUrl);
  const hasHiRes = coverHiRes !== book.coverUrl;
  const [hiResReady, setHiResReady] = useState(!hasHiRes);

  useEffect(() => {
    if (!hasHiRes) {
      setHiResReady(true);
      return;
    }
    setHiResReady(false);
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (!cancelled) setHiResReady(true);
    };
    img.onerror = () => {
      if (!cancelled) setHiResReady(false);
    };
    img.src = coverHiRes;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [book.coverUrl, coverHiRes, hasHiRes]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[#2c2418]/45 backdrop-blur-[2px]"
        aria-label="Close without saving"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-[min(96vw,88rem)] flex-col items-center justify-center gap-6 md:flex-row md:items-center md:gap-10 lg:gap-12">
        {/* Standalone cover (not attached to the details card) */}
        <div
          className="relative mx-auto aspect-[2/3] w-full max-w-[min(17rem,82vw)] shrink-0 overflow-hidden rounded-2xl bg-[#e8e2d8] shadow-[0_24px_60px_-12px_rgba(44,36,24,0.55)] sm:max-w-[min(19rem,80vw)] md:mx-0 md:h-[min(82vh,720px)] md:w-auto md:max-w-none md:shadow-[0_28px_70px_-14px_rgba(44,36,24,0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- same-origin OL URL as BookCard for cache; no Image optimizer wait */}
          <img
            src={book.coverUrl}
            alt=""
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
          {hasHiRes ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverHiRes}
              alt=""
              decoding="async"
              className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-200 ease-out ${
                hiResReady ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null}
        </div>

        {/* Details card */}
        <div
          className="flex max-h-[min(92vh,720px)] w-full min-w-0 max-w-lg flex-col overflow-hidden rounded-2xl bg-[#fdfaf5]/98 shadow-[0_20px_60px_-12px_rgba(44,36,24,0.42)] backdrop-blur-md md:max-w-xl md:flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7 md:px-8 md:pb-6 md:pt-8">
            <h2
              id="shelf-modal-title"
              className="font-serif text-xl font-semibold leading-snug text-[#1f1810] sm:text-2xl md:text-[1.65rem]"
            >
              {book.title}
            </h2>
            <p className="mt-2 text-sm font-medium text-[#5c5246] sm:text-base">{book.author}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#7a6f62]">
              Read {book.monthRead}
            </p>

            {displaySummary || summaryLoading ? (
              <div className="mt-6 border-t border-[#e8dfd2] pt-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#6b5e4f]">
                  Summary
                </p>
                {summaryLoading && !displaySummary ? (
                  <p className="text-sm text-[#7a6f62]">Loading…</p>
                ) : null}
                {displaySummary ? (
                  <>
                    <p
                      ref={summaryRef}
                      className={`text-sm leading-relaxed text-[#4a4238] sm:text-[0.95rem] ${summaryExpanded ? "" : "line-clamp-3"}`}
                    >
                      {displaySummary}
                    </p>
                    {summaryOverflows || summaryExpanded ? (
                      <button
                        type="button"
                        className="mt-2 text-sm font-medium text-[#5c4a3a] underline decoration-[#c4b5a0] underline-offset-[3px] hover:text-[#3d3428]"
                        onClick={() => setSummaryExpanded((v) => !v)}
                        aria-expanded={summaryExpanded}
                      >
                        {summaryExpanded ? "Less" : "More"}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 border-t border-[#e8dfd2] pt-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#6b5e4f]">
                Rating
              </label>
              <StarRatingInput value={rating} onChange={setRating} />
            </div>

            <div className="mt-6">
              <label
                htmlFor="shelf-review"
                className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#6b5e4f]"
              >
                Review
              </label>
              <textarea
                id="shelf-review"
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                rows={5}
                placeholder="A sentence or two…"
                className="w-full resize-y rounded-xl border border-[#ddd4c4] bg-white/90 px-3 py-2.5 text-sm leading-relaxed text-[#2c2418] outline-none ring-[#bfa88a]/30 placeholder:text-[#9a8e82] focus:ring-2"
              />
            </div>
          </div>

          <div className="shrink-0 border-t border-[#e8dfd2] bg-[#fdfaf5]/95 px-5 py-4 sm:px-7 md:px-8">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#5c5246] hover:bg-[#ebe4d8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-[#3d3428] px-5 py-2 text-sm font-medium text-[#fdfaf5] shadow-sm hover:bg-[#2a241c]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
