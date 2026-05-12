"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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
    <div className="flex items-center gap-1" role="group" aria-label="Rating out of 5">
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const filled = n <= v;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(n)}
            className={`min-h-11 min-w-11 rounded-md text-2xl leading-none transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8b7355] ${
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

  useEffect(() => {
    setRating(book.rating);
    setThought(book.thought ?? "");
  }, [book]);

  const handleSave = () => {
    onSave(book.id, rating, thought.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
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
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-[#fdfaf5]/98 shadow-[0_20px_60px_-12px_rgba(44,36,24,0.42)] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-sm bg-[#e8e2d8] shadow-[0_8px_24px_-6px_rgba(44,36,24,0.35)] sm:h-40 sm:w-[5.5rem]">
              <Image
                src={book.coverUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="shelf-modal-title"
                className="font-serif text-lg font-semibold leading-snug text-[#1f1810] sm:text-xl"
              >
                {book.title}
              </h2>
              <p className="mt-1 text-sm text-[#5c5246]">{book.author}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[#7a6f62]">
                Read {book.monthRead}
              </p>
            </div>
          </div>

          <div className="mt-5 border-t border-[#e8dfd2] pt-5">
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-[#6b5e4f]">
              Rating
            </label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>

          <div className="mt-5">
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
              rows={4}
              placeholder="A sentence or two…"
              className="w-full resize-y rounded-xl border border-[#ddd4c4] bg-white/90 px-3 py-2.5 text-sm leading-relaxed text-[#2c2418] outline-none ring-[#bfa88a]/30 placeholder:text-[#9a8e82] focus:ring-2"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
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
  );
}
