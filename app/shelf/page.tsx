import type { Metadata } from "next";
import shelfDefault from "@/data/books.json";
import { ShelfClient } from "@/components/shelf/ShelfClient";
import type { ShelfData } from "@/types/shelf";

export const metadata: Metadata = {
  title: "Shelf",
  description: "A pan-zoom canvas of books I've read.",
};

export default function ShelfPage() {
  return <ShelfClient initial={shelfDefault as ShelfData} />;
}
