import Link from "next/link";

export function Section({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-4 px-4 md:px-8 pb-3 border-b border-border-subtle">
        <div>
          {eyebrow && <p className="eyebrow text-[10.5px] text-brand-400 mb-1">{eyebrow}</p>}
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-ink-muted hover:text-ink hover:border-brand-400 transition-colors focus-ring"
          >
            {action.label}
          </Link>
        )}
      </div>
      <div className="px-4 md:px-8">{children}</div>
    </section>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl2 border border-dashed border-border py-12 px-6 text-center text-ink-muted">
      <p className="font-display font-semibold text-ink text-lg">{title}</p>
      {body && <p className="text-sm mt-1.5">{body}</p>}
    </div>
  );
}
