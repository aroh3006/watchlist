"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteListButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function del() {
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    router.push("/lists");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-muted">Delete this list?</span>
        <button onClick={del} className="text-accent font-medium focus-ring rounded px-2 py-1">Delete</button>
        <button onClick={() => setConfirming(false)} className="text-ink-muted focus-ring rounded px-2 py-1">Cancel</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-sm text-ink-faint hover:text-accent focus-ring rounded px-2 py-1">
      Delete list
    </button>
  );
}
