"use client";

/**
 * Same confirm-dialog look already used for the "Not Watched" removal flow
 * on show/movie pages (fixed dark overlay, centered card, Cancel plus a
 * primary action), pulled out here so new destructive confirmations reuse
 * it instead of copying the JSX again.
 */
export function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pending = false,
  danger = false,
}: {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl2 border border-border bg-bg-raised p-5 shadow-card">
        <p className="font-semibold text-sm mb-1">{title}</p>
        {body && <p className="text-xs text-ink-muted mb-4">{body}</p>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-xs border border-border text-ink-muted hover:text-ink transition-colors focus-ring disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`px-3 py-1.5 rounded-lg text-xs text-white transition-colors focus-ring disabled:opacity-60 ${
              danger ? "bg-danger hover:bg-danger-muted" : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
