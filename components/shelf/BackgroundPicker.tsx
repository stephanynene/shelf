"use client";

import Image from "next/image";
import { BACKGROUND_IDS, backgroundSrc, isBackgroundId } from "@/lib/backgrounds";

type Props = {
  currentId: string;
  onSelect: (id: string) => void;
};

export function BackgroundPicker({ currentId, onSelect }: Props) {
  const active = isBackgroundId(currentId) ? currentId : BACKGROUND_IDS[0];

  return (
    <div className="max-w-[min(100vw-3rem,20rem)] rounded-xl border border-white/50 bg-[#fdfaf5]/95 p-3 shadow-lg backdrop-blur-md">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#6b5e4f]">
        Surface
      </p>
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
        {BACKGROUND_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ring-offset-2 ring-offset-[#fdfaf5] ${
              id === active ? "ring-[#8b7355]" : "ring-transparent hover:ring-[#c4b5a0]"
            }`}
            aria-label={`Use ${id} background`}
            aria-pressed={id === active}
          >
            <Image src={backgroundSrc(id)} alt="" fill className="object-cover" sizes="56px" />
          </button>
        ))}
      </div>
    </div>
  );
}
