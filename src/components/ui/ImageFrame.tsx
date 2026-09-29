import Image from "next/image";
import type { ResolvedImage } from "@/lib/data/public";

/**
 * Responsive image with a fixed aspect ratio. When no image has been chosen yet,
 * renders a quiet, on-brand placeholder instead of a broken layout.
 */
export function ImageFrame({
  image,
  ratio = "4/3",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className = "",
  rounded = true,
}: {
  image: ResolvedImage | null | undefined;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-secondary ${rounded ? "rounded-[var(--radius-card)]" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <Placeholder />
      )}
    </div>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <svg className="h-full w-full text-primary/15" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
        <defs>
          <pattern id="ph-lines" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill="url(#ph-lines)" opacity="0.35" />
        <g fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30">
          <path d="M150 190 V130 L200 95 L250 130 V190 Z" />
          <path d="M185 190 V155 H215 V190" />
          <path d="M120 190 H280" />
        </g>
      </svg>
    </div>
  );
}
