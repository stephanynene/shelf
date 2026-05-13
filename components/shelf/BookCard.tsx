"use client";

import Image from "next/image";
import { useTransformContext } from "react-zoom-pan-pinch";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { BookPosition, ShelfBook } from "@/types/shelf";
import { CANVAS_CX, CANVAS_CY } from "./constants";

const DRAG_THRESHOLD = 6;
const HOVER_Z = 500_000;

type Props = {
  book: ShelfBook;
  deleteBinRef?: RefObject<HTMLDivElement | null>;
  onOpen: (book: ShelfBook) => void;
  onMove: (id: string, position: BookPosition) => void;
  onDragEnd?: (id: string) => void;
  onBookDelete?: (id: string) => void;
  onDeleteBinHover?: (active: boolean) => void;
};

const DRAG_Z = 1_000_000;

export function BookCard({
  book,
  deleteBinRef,
  onOpen,
  onMove,
  onDragEnd,
  onBookDelete,
  onDeleteBinHover,
}: Props) {
  const stackZ = book.layerRank ?? 0;
  const ctx = useTransformContext();
  const scale = ctx.transformState.scale;
  const deleteHoverRef = useRef(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origin: BookPosition;
    moved: boolean;
    active: boolean;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [finePointerHover, setFinePointerHover] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setFinePointerHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    deleteHoverRef.current = false;
    onDeleteBinHover?.(false);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...book.position },
      moved: false,
      active: true,
    };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.active) return;
    const bin = deleteBinRef?.current;
    if (bin) {
      const r = bin.getBoundingClientRect();
      const over =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (over !== deleteHoverRef.current) {
        deleteHoverRef.current = over;
        onDeleteBinHover?.(over);
      }
    }
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    onMove(book.id, {
      x: d.origin.x + dx,
      y: d.origin.y + dy,
      rotation: d.origin.rotation,
    });
  };

  const finishPointer = (e: React.PointerEvent | null, kind: "up" | "cancel") => {
    const d = dragRef.current;
    if (!d?.active) return;
    if (e) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    deleteHoverRef.current = false;
    onDeleteBinHover?.(false);

    if (kind === "up" && e && d.moved && deleteBinRef?.current) {
      const r = deleteBinRef.current.getBoundingClientRect();
      const { clientX, clientY } = e;
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        onBookDelete?.(book.id);
        endDrag();
        return;
      }
    }

    if (d.moved) onDragEnd?.(book.id);
    else if (kind === "up" && e) onOpen(book);
    endDrag();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    finishPointer(e, "up");
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    finishPointer(e, "cancel");
  };

  const { x, y, rotation } = book.position;

  const showPreview = finePointerHover === true && hovered && !isDragging;

  const zIndex = isDragging ? DRAG_Z + stackZ : showPreview ? HOVER_Z + stackZ : 10 + stackZ;

  return (
    <button
      type="button"
      className="shelf-book-card group absolute touch-none border-0 bg-transparent p-0 outline-none"
      style={{
        left: CANVAS_CX + x,
        top: CANVAS_CY + y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        cursor: isDragging ? "grabbing" : "grab",
        zIndex,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label={`Open details for ${book.title}`}
    >
      {showPreview ? (
        <div
          className="pointer-events-none absolute bottom-[calc(100%-10px)] left-1/2 z-10 w-48 -translate-x-1/2"
          aria-hidden
        >
          <div className="rounded-xl border border-[#d8cdc0]/95 bg-[#fdfaf5]/[0.97] px-3 py-2.5 shadow-[0_16px_34px_-16px_rgba(44,36,24,0.52)] ring-1 ring-black/[0.04] backdrop-blur-[2px]">
            <p className="text-center font-serif text-sm font-semibold leading-snug text-[#1f1810] line-clamp-3">
              {book.title}
            </p>
            <p className="mt-1 text-center text-[11px] font-medium tracking-[0.08em] text-amber-700">
              {"★".repeat(Math.max(0, Math.min(5, Math.round(book.rating))))}
              {"☆".repeat(Math.max(0, 5 - Math.max(0, Math.min(5, Math.round(book.rating)))))}
            </p>
          </div>
        </div>
      ) : null}

      <div className="w-36 overflow-hidden rounded-md shadow-[0_12px_28px_-6px_rgba(44,36,24,0.43),0_4px_10px_-4px_rgba(44,36,24,0.28)] transition-shadow group-hover:shadow-[0_18px_36px_-8px_rgba(44,36,24,0.5)]">
        <div className="relative aspect-[2/3] w-full bg-[#e8e2d8]">
          <Image
            src={book.coverUrl}
            alt=""
            fill
            unoptimized
            className="object-cover outline-none [display:block]"
            sizes="144px"
            draggable={false}
          />
        </div>
      </div>
    </button>
  );
}
