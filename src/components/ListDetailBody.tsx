"use client";

import { useState } from "react";
import { DeleteListButton } from "./DeleteListButton";
import { ListItemsGrid, type ListItemData } from "./ListItemsGrid";
import { EmptyState } from "./Section";
import { PencilIcon } from "./icons";

export function ListDetailBody({
  listId,
  name,
  description,
  visibility,
  items,
}: {
  listId: string;
  name: string;
  description: string | null;
  visibility: "Public" | "Private";
  items: ListItemData[];
}) {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{name}</h1>
          {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
          <p className="text-xs text-ink-faint mt-1">
            {visibility} · {items.length} items
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            aria-pressed={editMode}
            aria-label={editMode ? "Done editing this list" : "Edit this list"}
            title={editMode ? "Done editing" : "Edit list"}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors focus-ring ${
              editMode
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-border bg-bg-overlay text-ink-muted hover:text-ink hover:border-brand-400"
            }`}
          >
            <PencilIcon width={16} height={16} />
          </button>
          <DeleteListButton listId={listId} />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="This list is empty" body="Add shows or movies from their detail page." />
      ) : (
        <ListItemsGrid listId={listId} items={items} editMode={editMode} />
      )}
    </>
  );
}
