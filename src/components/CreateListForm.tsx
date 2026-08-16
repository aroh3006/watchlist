"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "./icons";

export function CreateListForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPublic }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors focus-ring"
      >
        <PlusIcon width={16} height={16} /> New list
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Create list">
      <form onSubmit={submit} className="w-full max-w-sm bg-bg-raised border border-border rounded-xl2 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">New list</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="focus-ring rounded">
            <XIcon />
          </button>
        </div>
        <label className="block text-sm text-ink-muted mb-1" htmlFor="list-name">Name</label>
        <input
          id="list-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring mb-3"
        />
        <label className="block text-sm text-ink-muted mb-1" htmlFor="list-desc">Description</label>
        <textarea
          id="list-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring mb-3"
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted mb-4">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          Make this list public
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2 text-sm transition-colors focus-ring"
        >
          {loading ? "Creating..." : "Create list"}
        </button>
      </form>
    </div>
  );
}
