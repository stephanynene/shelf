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
  position: BookPosition;
};

export type ShelfData = {
  background: string;
  books: ShelfBook[];
};
