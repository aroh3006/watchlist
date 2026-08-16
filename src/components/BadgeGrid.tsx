import { TrophyIcon, FlameIcon, StarIcon, CheckCircleIcon } from "./icons";

const ICONS: Record<string, React.ComponentType<{ width?: number; height?: number; className?: string }>> = {
  trophy: TrophyIcon,
  flame: FlameIcon,
  star: StarIcon,
  "check-circle": CheckCircleIcon,
};

export function BadgeGrid({ badges }: { badges: { id: string; name: string; description: string; iconKey: string; tier: number }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((b) => {
        const Icon = ICONS[b.iconKey] ?? TrophyIcon;
        return (
          <div key={b.id} className="rounded-xl2 border border-border-subtle bg-bg-raised p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Icon width={18} height={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{b.name}</p>
              <p className="text-xs text-ink-muted line-clamp-2">{b.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
