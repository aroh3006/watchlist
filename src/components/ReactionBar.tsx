"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { REACTION_EMOJI, REACTION_TYPES, type ReactionType } from "@/lib/constants";

export function ReactionBar({
  target,
  targetId,
  initialReaction,
}: {
  target: "episode" | "movie";
  targetId: string;
  initialReaction?: ReactionType | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<ReactionType | null>(initialReaction ?? null);

  async function react(type: ReactionType) {
    setSelected(type);
    await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [target === "episode" ? "episodeId" : "movieId"]: targetId, type }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="React to this">
      {REACTION_TYPES.map((type) => (
        <button
          key={type}
          onClick={() => react(type)}
          aria-pressed={selected === type}
          className={`text-sm px-2.5 py-1.5 rounded-full border transition-colors focus-ring ${
            selected === type ? "border-brand-400 bg-brand-900/30" : "border-border text-ink-muted hover:text-ink"
          }`}
        >
          {REACTION_EMOJI[type]}
        </button>
      ))}
    </div>
  );
}
