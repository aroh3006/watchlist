"use client";

import { StarIcon } from "./icons";

const STAR_COUNT = 5;

function formatStars(displayValue: number): string {
  return Number.isInteger(displayValue) ? String(displayValue) : displayValue.toFixed(1);
}

/**
 * Star rating on a 5-star scale with half-star granularity. The stored
 * score stays on the existing 1-10 integer scale (score = stars * 2), so
 * this is purely a display and input change, not a data migration.
 */
export function RatingStars({
  score,
  onChange,
  size = 16,
}: {
  score: number;
  onChange: (score: number) => void;
  size?: number;
}) {
  const displayValue = score / 2;

  function fillFor(starIndex: number): "empty" | "half" | "full" {
    if (displayValue >= starIndex) return "full";
    if (displayValue >= starIndex - 0.5) return "half";
    return "empty";
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" role="group" aria-label="Your rating">
        {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((starIndex) => {
          const fill = fillFor(starIndex);
          return (
            <span key={starIndex} className="relative inline-block" style={{ width: size, height: size }}>
              <StarIcon width={size} height={size} className="absolute inset-0 text-ink-faint" />
              {fill !== "empty" && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: fill === "half" ? "50%" : "100%" }}>
                  <StarIcon width={size} height={size} className="text-brand-300" fill="currentColor" />
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(starIndex * 2 - 1)}
                aria-label={`Rate ${starIndex - 0.5} out of 5 stars`}
                className="absolute inset-y-0 left-0 w-1/2 focus-ring"
              />
              <button
                type="button"
                onClick={() => onChange(starIndex * 2)}
                aria-label={`Rate ${starIndex} out of 5 stars`}
                className="absolute inset-y-0 right-0 w-1/2 focus-ring"
              />
            </span>
          );
        })}
      </div>
      {score > 0 && <span className="text-xs text-ink-muted">{formatStars(displayValue)}/5</span>}
    </div>
  );
}
