"use client";

import { useEffect, useState } from "react";
import { posterPlaceholder, backdropPlaceholder } from "@/lib/metadata/placeholderImage";

/**
 * Poster/backdrop <img> with a guaranteed fallback. Renders the generated
 * SVG placeholder whenever src is missing, and swaps to it on error if a
 * real URL is broken, instead of leaving a blank box.
 */
export function SafeImage({
  src,
  alt = "",
  className,
  seed,
  title,
  kind = "poster",
  loading,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  seed: string;
  title: string;
  kind?: "poster" | "backdrop";
  loading?: "lazy" | "eager";
}) {
  const placeholder = kind === "backdrop" ? backdropPlaceholder(seed, title) : posterPlaceholder(seed, title);
  const [imgSrc, setImgSrc] = useState(src || placeholder);

  useEffect(() => setImgSrc(src || placeholder), [src, placeholder]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imgSrc} alt={alt} loading={loading} className={className} onError={() => setImgSrc(placeholder)} />
  );
}
