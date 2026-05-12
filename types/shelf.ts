export type BookPosition = {
  x: number;
  y: number;
  rotation: number;
};

export type ShelfBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  monthRead: string;
  rating: number;
  thought: string;
  /** Short plot teaser or your own blurb; modal may also fetch from Open Library when missing. */
  summary?: string;
  /** Higher = drawn on top; updated when a cover is dragged. */
  layerRank?: number;
  position: BookPosition;
};

export type ShelfData = {
  background: string;
  books: ShelfBook[];
};
