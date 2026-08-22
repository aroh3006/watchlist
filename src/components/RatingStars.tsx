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
  onClear,
  size = 22,
}: {
  score: number;
  onChange: (score: number) => void;
  onClear: () => void;
  size?: number;
}) {
  const displayValue = score / 2;

  function fillFor(starIndex: number): "empty" | "half" | "full" {
    if (displayValue >= starIndex) return "full";
    if (displayValue >= starIndex - 0.5) return "half";
    return "empty";
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5" role="group" aria-label="Your rating">
        {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((starIndex) => {
          const fill = fillFor(starIndex);
          return (
            <span key={starIndex} className="relative inline-block" style={{ width: size, height: size }}>
              <StarIcon width={size} height={size} className="absolute top-0 left-0 text-ink-faint" />
              {fill !== "empty" && (
                <span
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: fill === "half" ? size / 2 : size, height: size }}
                >
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
      {score > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-muted">{formatStars(displayValue)}/5</span>
          <button type="button" onClick={onClear} className="text-[11px] text-ink-faint hover:text-accent focus-ring rounded px-1">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
