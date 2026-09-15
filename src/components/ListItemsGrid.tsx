"use client";

import { useEffect, useState } from "react";
import { PosterGrid, PosterCard } from "./PosterCard";
import { EmptyState } from "./Section";

export interface ListItemData {
  id: string;
  href: string;
  title: string;
  posterUrl: string | null;
}

const DEBOUNCE_MS = 300;

/**
 * Filters a list's already-loaded items client-side as the user types, the
 * same debounced-typing feel as Discover's search, but there is no server
 * round trip here, the items are already on the page.
 */
export function ListItemsGrid({ items }: { items: ListItemData[] }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const needle = debounced.trim().toLowerCase();
  const filtered = needle ? items.filter((item) => item.title.toLowerCase().includes(needle)) : items;

  return (
    <div>
      <div className="max-w-sm mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this list..."
          aria-label="Search this list"
          className="w-full rounded-lg bg-bg-overlay border border-border px-4 py-2.5 text-sm focus-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matches in this list" body="Try a different title." />
      ) : (
        <PosterGrid>
          {filtered.map((item) => (
            <PosterCard key={item.id} href={item.href} title={item.title} posterUrl={item.posterUrl} fixedWidth={false} />
          ))}
        </PosterGrid>
      )}
    </div>
  );
}
