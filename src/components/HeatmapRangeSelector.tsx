"use client";

import Link from "next/link";

const RANGES: { key: string; label: string }[] = [
  { key: "6m", label: "6 months" },
  { key: "12m", label: "12 months" },
  { key: "year", label: "This year" },
];

export function HeatmapRangeSelector({ current }: { current: string }) {
  return (
    <div className="flex gap-1 shrink-0">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`/profile?range=${r.key}`}
          aria-current={current === r.key ? "true" : undefined}
          className={`px-2.5 py-1 rounded-full text-xs border transition-colors focus-ring ${
            current === r.key ? "bg-brand-500 border-brand-500 text-white" : "border-border text-ink-muted hover:text-ink"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
