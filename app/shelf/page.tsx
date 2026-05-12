import type { Metadata } from "next";
import { Suspense } from "react";
import shelfDefault from "@/data/books.json";
import { ShelfClient } from "@/components/shelf/ShelfClient";
import type { ShelfData } from "@/types/shelf";

export const metadata: Metadata = {
  title: "Shelf",
  description: "A pan-zoom canvas of books I've read.",
};

export default function ShelfPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f6f0e6]" />}>
      <ShelfClient initial={shelfDefault as ShelfData} />
    </Suspense>
  );
}
