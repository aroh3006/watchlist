import { prisma } from "@/lib/prisma";
import { computeStreaks } from "./activity";
import { todayKeyInTimezone, addDaysToKey, daysAgoKey } from "@/lib/time";

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  episodeCount: number;
  movieCount: number;
  totalMinutes: number;
  activityScore: number;
}

export interface HeatmapData {
  cells: HeatmapCell[];
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;
}

const RANGE_DAYS: Record<string, number> = {
  "6m": 182,
  "12m": 365,
  year: 365,
};

/**
 * Builds the profile contribution heatmap directly from the materialized
 * DailyWatchActivity rollup (itself derived from WatchEvent history, see
 * recomputeDailyActivityForUser). Fills in zero-activity days so the grid
 * is a complete, gapless calendar.
 */
export async function getHeatmapData(userId: string, timeZone: string, range: "6m" | "12m" | "year" = "12m"): Promise<HeatmapData> {
  const today = todayKeyInTimezone(timeZone);
  let startKey: string;
  if (range === "year") {
    startKey = `${today.slice(0, 4)}-01-01`;
  } else {
    startKey = daysAgoKey(RANGE_DAYS[range], timeZone);
  }

  const rows = await prisma.dailyWatchActivity.findMany({
    where: { userId, date: { gte: startKey, lte: today } },
    orderBy: { date: "asc" },
  });
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const cells: HeatmapCell[] = [];
  let cursor = startKey;
  while (cursor <= today) {
    const row = byDate.get(cursor);
    cells.push({
      date: cursor,
      episodeCount: row?.episodeCount ?? 0,
      movieCount: row?.movieCount ?? 0,
      totalMinutes: row?.totalMinutes ?? 0,
      activityScore: row?.activityScore ?? 0,
    });
    cursor = addDaysToKey(cursor, 1);
  }

  // Streaks/totals are computed over the user's FULL history, not just the
  // visible window, so switching the range selector doesn't change them.
  const allActivity = await prisma.dailyWatchActivity.findMany({ where: { userId }, select: { date: true, episodeCount: true, movieCount: true, totalMinutes: true } });
  const yesterday = addDaysToKey(today, -1);
  const streaks = computeStreaks(
    allActivity.filter((a) => a.episodeCount > 0 || a.movieCount > 0).map((a) => a.date),
    today,
    yesterday
  );

  return {
    cells,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    activeDays: streaks.activeDays,
    totalEpisodes: allActivity.reduce((s, a) => s + a.episodeCount, 0),
    totalMovies: allActivity.reduce((s, a) => s + a.movieCount, 0),
    totalMinutes: allActivity.reduce((s, a) => s + a.totalMinutes, 0),
  };
}
