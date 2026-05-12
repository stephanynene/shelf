import Image from "next/image";
import { backgroundSrc } from "@/lib/backgrounds";

type Props = {
  backgroundId: string;
};

export function BackgroundLayer({ backgroundId }: Props) {
  const src = backgroundSrc(backgroundId);

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Image
        src={src}
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(62,54,42,0.12)_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#f6f0e6]/35 mix-blend-multiply" aria-hidden />
    </div>
  );
}
