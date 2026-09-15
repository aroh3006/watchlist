"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "./icons";
import { ConfirmModal } from "./ConfirmModal";

export function DeleteListButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function del() {
    setDeleting(true);
    await fetch(`/api/lists/${listId}`, { method: "DELETE" });
    router.push("/lists");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label="Delete list"
        title="Delete list"
        className="w-9 h-9 rounded-lg border border-border bg-bg-overlay flex items-center justify-center text-ink-muted hover:text-danger hover:border-danger transition-colors focus-ring"
      >
        <TrashIcon width={16} height={16} />
      </button>
      {confirming && (
        <ConfirmModal
          title="Delete this list?"
          body="This can't be undone."
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          danger
          pending={deleting}
          onCancel={() => setConfirming(false)}
          onConfirm={del}
        />
      )}
    </>
  );
}
