import Link from "next/link";
import { requireUserWithProfile } from "@/lib/session";
import { getDashboardStats } from "@/lib/stats/dashboard";
import { MonthlyActivityChart, GenrePieChart } from "@/components/StatsCharts";
import { EmptyState } from "@/components/Section";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${min % 60}m`;
  return `${min}m`;
}

export default async function StatsPage() {
  const user = await requireUserWithProfile();
  const stats = await getDashboardStats(user.id, user.profile.timezone);
  const hasData = stats.monthly.length > 0;

  return (
    <div className="py-6 md:py-8 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-1">Statistics</h1>
      <p className="text-sm text-ink-muted mb-6">Every number here comes from your actual watch history.</p>

      {!hasData ? (
        <EmptyState title="No stats yet" body="Mark a few episodes or movies as watched to see your statistics." />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Tile label="TV time" value={formatMinutes(stats.totalEpisodeMinutes)} />
            <Tile label="Movie time" value={formatMinutes(stats.totalMovieMinutes)} />
            <Tile label="Total watch time" value={formatMinutes(stats.totalEpisodeMinutes + stats.totalMovieMinutes)} />
            <Tile label="Completion rate" value={`${Math.round(stats.completionRate)}%`} />
          </div>

          <section className="rounded-xl2 border border-border bg-bg-raised p-4 md:p-6">
            <h2 className="font-semibold mb-4">Activity Over Time</h2>
            <MonthlyActivityChart data={stats.monthly} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-xl2 border border-border bg-bg-raised p-4 md:p-6">
              <h2 className="font-semibold mb-4">Most Watched Genres</h2>
              <GenrePieChart data={stats.genreBreakdown} />
            </section>

            <section className="rounded-xl2 border border-border bg-bg-raised p-4 md:p-6">
              <h2 className="font-semibold mb-4">Favorite Networks</h2>
              {stats.networkBreakdown.length === 0 ? (
                <p className="text-sm text-ink-muted">Not enough data yet.</p>
              ) : (
                <ul className="space-y-2">
                  {stats.networkBreakdown.map((n) => (
                    <li key={n.name} className="flex items-center gap-3">
                      <span className="text-sm w-32 truncate">{n.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-bg-overlay overflow-hidden">
                        <div
                          className="h-full bg-brand-400"
                          style={{ width: `${(n.count / stats.networkBreakdown[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-muted w-8 text-right">{n.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-xl2 border border-border bg-bg-raised p-4 md:p-6">
            <h2 className="font-semibold mb-4">Most Watched Shows</h2>
            {stats.topShows.length === 0 ? (
              <p className="text-sm text-ink-muted">Not enough data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topShows.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/shows/${s.slug}`} className="flex items-center justify-between text-sm hover:text-brand-300 focus-ring rounded">
                      <span className="truncate">{s.title}</span>
                      <span className="text-ink-muted shrink-0 ml-2">{s.episodes} episodes</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-border-subtle bg-bg-raised p-3">
      <p className="text-xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
