"use client";

import { useLayoutEffect } from "react";
import { TransformComponent, TransformWrapper, useTransformContext } from "react-zoom-pan-pinch";
import type { BookPosition, ShelfBook } from "@/types/shelf";
import { BookCard } from "./BookCard";
import { CANVAS_H, CANVAS_W } from "./constants";

export type BoardPlacementGet = () => { x: number; y: number };

function BoardPlacementRef({
  placementRef,
}: {
  placementRef: React.MutableRefObject<BoardPlacementGet | null>;
}) {
  const inst = useTransformContext();

  useLayoutEffect(() => {
    placementRef.current = () => {
      const content = inst.contentComponent;
      if (!content) return { x: 0, y: 0 };
      const cr = content.getBoundingClientRect();
      const { scale } = inst.transformState;
      const vx = window.innerWidth / 2;
      const vy = window.innerHeight / 2;
      const lx = (vx - cr.left) / scale;
      const ly = (vy - cr.top) / scale;
      return { x: lx - CANVAS_W / 2, y: ly - CANVAS_H / 2 };
    };
    return () => {
      placementRef.current = null;
    };
  }, [inst, placementRef]);

  return null;
}

type Props = {
  books: ShelfBook[];
  isEditMode: boolean;
  onBookOpen: (b: ShelfBook) => void;
  onBookMove: (id: string, p: BookPosition) => void;
  placementRef: React.MutableRefObject<BoardPlacementGet | null>;
};

export function ShelfCanvas({
  books,
  isEditMode,
  onBookOpen,
  onBookMove,
  placementRef,
}: Props) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.4}
      maxScale={2}
      limitToBounds={false}
      centerOnInit
      doubleClick={{ disabled: true }}
      wheel={{ step: 0.12 }}
      panning={{
        velocityDisabled: true,
        excluded: ["shelf-book-card", "shelf-no-pan"],
        allowLeftClickPan: true,
      }}
    >
      <TransformComponent
        wrapperClass="!w-full !h-full"
        wrapperStyle={{
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
        contentStyle={{ transformOrigin: "0 0" }}
        contentClass="will-change-transform"
      >
        <BoardPlacementRef placementRef={placementRef} />
        <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
          {books.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              isEditMode={isEditMode}
              onOpen={onBookOpen}
              onMove={onBookMove}
            />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
