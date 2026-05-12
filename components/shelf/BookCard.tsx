"use client";

import Image from "next/image";
import { useTransformContext } from "react-zoom-pan-pinch";
import { useCallback, useRef, useState } from "react";
import type { BookPosition, ShelfBook } from "@/types/shelf";
import { CANVAS_CX, CANVAS_CY } from "./constants";

const DRAG_THRESHOLD = 6;

type Props = {
  book: ShelfBook;
  isEditMode: boolean;
  onOpen: (book: ShelfBook) => void;
  onMove: (id: string, position: BookPosition) => void;
};

export function BookCard({ book, isEditMode, onOpen, onMove }: Props) {
  const ctx = useTransformContext();
  const scale = ctx.transformState.scale;
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origin: BookPosition;
    moved: boolean;
    active: boolean;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
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
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    onMove(book.id, {
      x: d.origin.x + dx,
      y: d.origin.y + dy,
      rotation: d.origin.rotation,
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.active) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!d.moved) onOpen(book);
    endDrag();
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (isEditMode) return;
    e.stopPropagation();
  };

  const { x, y, rotation } = book.position;

  return (
    <button
      type="button"
      className="shelf-book-card group absolute touch-none border-0 bg-transparent p-0 outline-none"
      style={{
        left: CANVAS_CX + x,
        top: CANVAS_CY + y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        cursor: isEditMode ? (isDragging ? "grabbing" : "grab") : "pointer",
        zIndex: isDragging ? 20 : 10,
      }}
      onClickCapture={onClickCapture}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endDrag}
      onClick={() => {
        if (!isEditMode) onOpen(book);
      }}
      aria-label={`Open details for ${book.title}`}
    >
      <div className="w-36 overflow-hidden rounded-[2px] shadow-[0_12px_28px_-6px_rgba(44,36,24,0.43),0_4px_10px_-4px_rgba(44,36,24,0.28)] transition-shadow group-hover:shadow-[0_18px_36px_-8px_rgba(44,36,24,0.5)]">
        <div className="relative aspect-[2/3] w-full bg-[#e8e2d8]">
          <Image
            src={book.coverUrl}
            alt=""
            fill
            className="object-cover outline-none [display:block]"
            sizes="144px"
            draggable={false}
          />
        </div>
      </div>
    </button>
  );
}
