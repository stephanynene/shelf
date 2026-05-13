import { backgroundSrc } from "@/lib/backgrounds";

type Props = {
  backgroundId: string;
};

export function BackgroundLayer({ backgroundId }: Props) {
  const src = backgroundSrc(backgroundId);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center [backface-visibility:hidden] [transform:translateZ(0)]"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(62,54,42,0.05)_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#f6f0e6]/12 mix-blend-multiply" aria-hidden />
    </div>
  );
}
