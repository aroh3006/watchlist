import { prisma } from "@/lib/prisma";
import { dateKeyInTimezone } from "@/lib/time";

export interface MonthlyPoint {
  month: string; // YYYY-MM
  episodes: number;
  movies: number;
}

export interface GenreSlice {
  name: string;
  count: number;
}

export interface DashboardStats {
  monthly: MonthlyPoint[];
  genreBreakdown: GenreSlice[];
  networkBreakdown: GenreSlice[];
  topShows: { title: string; slug: string; episodes: number }[];
  completionRate: number; // completed shows / (completed+watching+paused+dropped)
  totalEpisodeMinutes: number;
  totalMovieMinutes: number;
}

export async function getDashboardStats(userId: string, timeZone: string): Promise<DashboardStats> {
  const [episodeWatches, movieWatches, userShows] = await Promise.all([
    prisma.episodeWatch.findMany({
      where: { userId },
      select: { watchedAt: true, episode: { select: { runtime: true, showId: true, season: { select: { show: { select: { title: true, slug: true, networkId: true, network: true } } } } } } },
    }),
    prisma.movieWatch.findMany({
      where: { userId },
      select: { watchedAt: true, movie: { select: { runtime: true } } },
    }),
    prisma.userShow.findMany({ where: { userId }, select: { status: true } }),
  ]);

  const monthMap = new Map<string, MonthlyPoint>();
  function bump(month: string, key: "episodes" | "movies") {
    const point = monthMap.get(month) ?? { month, episodes: 0, movies: 0 };
    point[key] += 1;
    monthMap.set(month, point);
  }
  for (const w of episodeWatches) {
    const key = dateKeyInTimezone(w.watchedAt, timeZone).slice(0, 7);
    bump(key, "episodes");
  }
  for (const w of movieWatches) {
    const key = dateKeyInTimezone(w.watchedAt, timeZone).slice(0, 7);
    bump(key, "movies");
  }
  const monthly = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  const showIds = Array.from(new Set(episodeWatches.map((w) => w.episode.showId)));
  const genreRows = showIds.length
    ? await prisma.showGenre.findMany({ where: { showId: { in: showIds } }, include: { genre: true } })
    : [];
  const genreCount = new Map<string, number>();
  for (const g of genreRows) genreCount.set(g.genre.name, (genreCount.get(g.genre.name) ?? 0) + 1);
  const genreBreakdown = Array.from(genreCount.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const networkCount = new Map<string, number>();
  for (const w of episodeWatches) {
    const name = w.episode.season.show.network?.name;
    if (name) networkCount.set(name, (networkCount.get(name) ?? 0) + 1);
  }
  const networkBreakdown = Array.from(networkCount.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const showEpCount = new Map<string, { title: string; slug: string; count: number }>();
  for (const w of episodeWatches) {
    const show = w.episode.season.show;
    const existing = showEpCount.get(show.slug) ?? { title: show.title, slug: show.slug, count: 0 };
    existing.count++;
    showEpCount.set(show.slug, existing);
  }
  const topShows = Array.from(showEpCount.values()).sort((a, b) => b.count - a.count).slice(0, 8).map((s) => ({ title: s.title, slug: s.slug, episodes: s.count }));

  const completed = userShows.filter((s) => s.status === "COMPLETED").length;
  const relevant = userShows.filter((s) => s.status !== "PLANNED").length;
  const completionRate = relevant > 0 ? (completed / relevant) * 100 : 0;

  return {
    monthly,
    genreBreakdown,
    networkBreakdown,
    topShows,
    completionRate,
    totalEpisodeMinutes: episodeWatches.reduce((s, w) => s + (w.episode.runtime ?? 0), 0),
    totalMovieMinutes: movieWatches.reduce((s, w) => s + (w.movie.runtime ?? 0), 0),
  };
}
