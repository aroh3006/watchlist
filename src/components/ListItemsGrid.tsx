"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterGrid, PosterCard } from "./PosterCard";
import { EmptyState } from "./Section";
import { ConfirmModal } from "./ConfirmModal";
import { XIcon } from "./icons";

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
 * round trip here, the items are already on the page. In edit mode, every
 * visible card (post-filter, same as everywhere else) gets a remove button
 * that only ever deletes the CustomListItem row for that list, never the
 * show/movie's tracking status, rating, or favorite, those live in
 * completely separate tables.
 */
export function ListItemsGrid({
  listId,
  items,
  editMode,
}: {
  listId: string;
  items: ListItemData[];
  editMode: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  const needle = debounced.trim().toLowerCase();
  const present = items.filter((item) => !removedIds.has(item.id));
  const filtered = needle ? present.filter((item) => item.title.toLowerCase().includes(needle)) : present;
  const pendingItem = pendingRemoveId ? items.find((item) => item.id === pendingRemoveId) ?? null : null;

  async function confirmRemove() {
    if (!pendingRemoveId) return;
    setRemoving(true);
    await fetch(`/api/lists/${listId}/items/${pendingRemoveId}`, { method: "DELETE" });
    setRemovedIds((prev) => new Set(prev).add(pendingRemoveId));
    setRemoving(false);
    setPendingRemoveId(null);
    router.refresh();
  }

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
            <div key={item.id} className="relative">
              <PosterCard href={item.href} title={item.title} posterUrl={item.posterUrl} fixedWidth={false} />
              {editMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPendingRemoveId(item.id);
                  }}
                  aria-label={`Remove ${item.title} from this list`}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-danger transition-colors focus-ring"
                >
                  <XIcon width={14} height={14} />
                </button>
              )}
            </div>
          ))}
        </PosterGrid>
      )}

      {pendingItem && (
        <ConfirmModal
          title={`Remove ${pendingItem.title} from this list?`}
          body="This only removes it from this list, your watch status, rating, and favorite are unaffected."
          confirmLabel={removing ? "Removing..." : "Remove"}
          danger
          pending={removing}
          onCancel={() => setPendingRemoveId(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
