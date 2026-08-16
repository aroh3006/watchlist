"use client";

import { useEffect, useState } from "react";
import { ListIcon } from "./icons";

interface ListSummary {
  id: string;
  name: string;
}

export function AddToListButton({ showId, movieId }: { showId?: string; movieId?: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && !lists) {
      fetch("/api/lists")
        .then((r) => r.json())
        .then(setLists)
        .catch(() => setLists([]));
    }
  }, [open, lists]);

  async function addTo(listId: string) {
    await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId, movieId }),
    });
    setAddedTo((prev) => new Set(prev).add(listId));
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="rounded-lg border border-border px-3 py-2 text-sm flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors focus-ring"
      >
        <ListIcon width={16} height={16} /> Add to list
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-52 rounded-lg border border-border bg-bg-raised shadow-card p-1">
          {lists === null ? (
            <p className="text-xs text-ink-muted p-2">Loading...</p>
          ) : lists.length === 0 ? (
            <p className="text-xs text-ink-muted p-2">No lists yet. Create one from the Lists page.</p>
          ) : (
            lists.map((l) => (
              <button
                key={l.id}
                onClick={() => addTo(l.id)}
                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-bg-overlay focus-ring flex items-center justify-between"
              >
                {l.name}
                {addedTo.has(l.id) && <span className="text-brand-300 text-xs">Added</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
