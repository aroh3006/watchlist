import { requireUser } from "@/lib/session";
import { DownloadIcon } from "@/components/icons";

export default async function ExportPage() {
  await requireUser();
  return (
    <div className="py-6 md:py-8 px-4 md:px-8 max-w-xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-1">Export your data</h1>
      <p className="text-sm text-ink-muted mb-6">
        Download everything Watchlist has stored about your activity — profile, watch history, ratings,
        favorites, lists, and badges. Exports are generated fresh from your account each time.
      </p>
      <div className="space-y-3">
        <ExportOption href="/api/export/json" title="JSON" body="Full structured export of every table." />
        <ExportOption href="/api/export/csv" title="CSV" body="Combined episode + movie watch history, one row per watch." />
        <ExportOption href="/api/export/zip" title="ZIP of CSVs" body="Every table as its own CSV file inside a ZIP archive." />
      </div>
    </div>
  );
}

function ExportOption({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl2 border border-border bg-bg-raised p-4 hover:border-brand-700 transition-colors focus-ring"
    >
      <DownloadIcon className="text-ink-muted shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-ink-muted">{body}</p>
      </div>
    </a>
  );
}
