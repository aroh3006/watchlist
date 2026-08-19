import Link from "next/link";
import { SafeImage } from "./SafeImage";

export function PosterCard({
  href,
  title,
  posterUrl,
  subtitle,
  progressPct,
  badge,
  fixedWidth = true,
}: {
  href: string;
  title: string;
  posterUrl?: string | null;
  subtitle?: string;
  progressPct?: number;
  badge?: string;
  /** Set false inside a CSS grid (PosterGrid) so the card fills its grid
   * cell instead of carrying its own fixed width, which is what was
   * causing long titles to bleed into the neighboring card. */
  fixedWidth?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group block focus-ring rounded-lg ${fixedWidth ? "shrink-0 w-[140px] sm:w-[160px]" : "w-full"}`}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-overlay border border-border-subtle">
        <SafeImage
          src={posterUrl}
          seed={href}
          title={title}
          kind="poster"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <span className="absolute top-1.5 left-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/70 text-white">
            {badge}
          </span>
        )}
        {typeof progressPct === "number" && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
            <div className="h-full bg-brand-400" style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-ink truncate">{title}</p>
      {subtitle && <p className="text-xs text-ink-muted truncate">{subtitle}</p>}
    </Link>
  );
}

export function PosterRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">{children}</div>;
}

export function PosterGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {children}
    </div>
  );
}
