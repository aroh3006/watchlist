import { requireUserWithProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getHeatmapData } from "@/lib/stats/heatmap";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { HeatmapRangeSelector } from "@/components/HeatmapRangeSelector";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { AvatarUpload } from "@/components/AvatarUpload";
import { PosterRow, PosterCard } from "@/components/PosterCard";
import { EmptyState } from "@/components/Section";

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${min % 60}m`;
  return `${min}m`;
}

export default async function ProfilePage({ searchParams }: { searchParams: { range?: string } }) {
  const user = await requireUserWithProfile();
  const range = (searchParams.range as "6m" | "12m" | "year") ?? "12m";

  const [heatmap, episodeCount, movieCount, completedShows, completedMovies, favShows, favMovies, lists] = await Promise.all([
    getHeatmapData(user.id, user.profile.timezone, range),
    prisma.episodeWatch.count({ where: { userId: user.id } }),
    prisma.movieWatch.count({ where: { userId: user.id } }),
    prisma.userShow.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.userMovie.count({ where: { userId: user.id, status: "COMPLETED" } }),
    prisma.favorite.findMany({ where: { userId: user.id, targetType: "SHOW" }, include: { show: true }, take: 10 }),
    prisma.favorite.findMany({ where: { userId: user.id, targetType: "MOVIE" }, include: { movie: true }, take: 10 }),
    prisma.customList.count({ where: { userId: user.id } }),
  ]);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <div className="py-6 md:py-8 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <AvatarUpload
          avatarUrl={user.profile.avatarUrl ?? null}
          initial={(user.profile.displayName ?? user.name ?? "?")[0]?.toUpperCase() ?? "?"}
        />
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{user.profile.displayName ?? user.name}</h1>
          <p className="text-sm text-ink-muted">
            @{user.name} · Joined {dbUser.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          {user.profile.bio && <p className="text-sm text-ink-muted mt-1 max-w-md">{user.profile.bio}</p>}
        </div>
        <div className="ml-auto">
          <TimezoneSelector current={user.profile.timezone} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatTile label="Episodes watched" value={episodeCount.toLocaleString()} />
        <StatTile label="Movies watched" value={movieCount.toLocaleString()} />
        <StatTile label="Total watch time" value={formatMinutes(heatmap.totalMinutes)} />
        <StatTile label="Current streak" value={`${heatmap.currentStreak}d`} />
        <StatTile label="Longest streak" value={`${heatmap.longestStreak}d`} />
        <StatTile label="Active days" value={heatmap.activeDays.toLocaleString()} />
        <StatTile label="Shows completed" value={completedShows.toLocaleString()} />
        <StatTile label="Movies completed" value={completedMovies.toLocaleString()} />
      </div>

      <section className="mb-8 rounded-xl2 border border-border bg-bg-raised p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="font-semibold">Watch Activity</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Every episode or movie you watch lights up its day. Streak: {heatmap.currentStreak} day{heatmap.currentStreak !== 1 ? "s" : ""} ·
              Longest: {heatmap.longestStreak} day{heatmap.longestStreak !== 1 ? "s" : ""}
            </p>
          </div>
          <HeatmapRangeSelector current={range} />
        </div>
        <ContributionHeatmap cells={heatmap.cells} />
      </section>

      {favShows.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3">Favorite Shows</h2>
          <PosterRow>
            {favShows.map((f) => f.show && <PosterCard key={f.id} href={`/shows/${f.show.slug}`} title={f.show.title} posterUrl={f.show.posterUrl} />)}
          </PosterRow>
        </section>
      )}

      {favMovies.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold mb-3">Favorite Movies</h2>
          <PosterRow>
            {favMovies.map((f) => f.movie && <PosterCard key={f.id} href={`/movies/${f.movie.slug}`} title={f.movie.title} posterUrl={f.movie.posterUrl} />)}
          </PosterRow>
        </section>
      )}

      {favShows.length === 0 && favMovies.length === 0 && (
        <EmptyState title="Nothing here yet" body="Watch something and mark favorites to fill out your profile." />
      )}

      <p className="text-xs text-ink-faint mt-4">
        {lists} custom list{lists !== 1 ? "s" : ""} · <a href="/lists" className="underline focus-ring rounded">Manage lists</a> ·{" "}
        <a href="/import" className="underline focus-ring rounded">Import data</a> ·{" "}
        <a href="/export" className="underline focus-ring rounded">Export data</a>
      </p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-border-subtle bg-bg-raised p-3">
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-ink-muted mt-0.5">{label}</p>
    </div>
  );
}
