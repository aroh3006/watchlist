"use client";

import { useState } from "react";

export function SpoilerGate({ watched, children }: { watched: boolean; children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(watched);

  if (revealed) return <>{children}</>;

  return (
    <div className="rounded-xl2 border border-dashed border-border p-6 text-center">
      <p className="text-sm text-ink-muted mb-3">
        This section may contain spoilers for an episode you haven&apos;t watched yet.
      </p>
      <button
        onClick={() => setRevealed(true)}
        className="text-sm font-medium px-4 py-2 rounded-lg bg-bg-overlay border border-border hover:border-ink-faint transition-colors focus-ring"
      >
        Show anyway
      </button>
    </div>
  );
}
