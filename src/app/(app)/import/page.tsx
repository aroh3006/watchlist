import { requireUser } from "@/lib/session";
import { ImportWizard } from "@/components/ImportWizard";

export default async function ImportPage() {
  await requireUser();
  return (
    <div className="py-6 md:py-8 px-4 md:px-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-1">Import your history</h1>
      <p className="text-sm text-ink-muted mb-6">
        Upload a ZIP of CSV exports (or a single CSV) from a previous tracker. Watchlist automatically maps common
        columns, matches titles against its catalog, and lets you resolve anything ambiguous before committing.
        Re-uploading the same file is always safe — matching watch events are never duplicated.
      </p>
      <ImportWizard />
    </div>
  );
}
