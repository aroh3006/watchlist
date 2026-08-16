import { prisma } from "@/lib/prisma";
import { dateKeyInTimezone } from "@/lib/time";

/**
 * Activity score buckets that drive heatmap cell intensity. Thresholds are
 * based on a combined score of episodes*1 + movies*2 (a movie is "worth"
 * roughly two episodes of attention) so that watching either contributes
 * meaningfully, per the product spec.
 */
export function activityScoreFor(episodeCount: number, movieCount: number): number {
  const weighted = episodeCount + movieCount * 2;
  if (weighted <= 0) return 0;
  if (weighted === 1) return 1;
  if (weighted <= 3) return 2;
  if (weighted <= 6) return 3;
  return 4;
}

/**
 * Rebuilds the DailyWatchActivity materialized rollup for a user from the
 * authoritative EpisodeWatch/MovieWatch event log. Safe to call repeatedly
 * (e.g. after an import or a manual watch toggle) — it's a derived cache,
 * never a source of truth.
 */
export async function recomputeDailyActivityForUser(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const timeZone = profile?.timezone ?? "UTC";

  const [episodeWatches, movieWatches] = await Promise.all([
    prisma.episodeWatch.findMany({
      where: { userId },
      include: { episode: { select: { runtime: true } } },
    }),
    prisma.movieWatch.findMany({
      where: { userId },
      include: { movie: { select: { runtime: true } } },
    }),
  ]);

  type DayAgg = { episodeCount: number; movieCount: number; totalMinutes: number };
  const byDay = new Map<string, DayAgg>();

  for (const w of episodeWatches) {
    const key = dateKeyInTimezone(w.watchedAt, timeZone);
    const agg = byDay.get(key) ?? { episodeCount: 0, movieCount: 0, totalMinutes: 0 };
    agg.episodeCount += 1;
    agg.totalMinutes += w.episode.runtime ?? 0;
    byDay.set(key, agg);
  }
  for (const w of movieWatches) {
    const key = dateKeyInTimezone(w.watchedAt, timeZone);
    const agg = byDay.get(key) ?? { episodeCount: 0, movieCount: 0, totalMinutes: 0 };
    agg.movieCount += 1;
    agg.totalMinutes += w.movie.runtime ?? 0;
    byDay.set(key, agg);
  }

  await prisma.$transaction([
    prisma.dailyWatchActivity.deleteMany({ where: { userId } }),
    ...Array.from(byDay.entries()).map(([date, agg]) =>
      prisma.dailyWatchActivity.create({
        data: {
          userId,
          date,
          episodeCount: agg.episodeCount,
          movieCount: agg.movieCount,
          totalMinutes: agg.totalMinutes,
          activityScore: activityScoreFor(agg.episodeCount, agg.movieCount),
        },
      })
    ),
  ]);
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
}

/**
 * Streak definition: a "day" counts as active if it has at least one watch
 * event. The current streak counts consecutive active days ending at
 * *today or yesterday* — i.e. if the user watched yesterday but not yet
 * today, the streak is still considered live (they have until the end of
 * today, their time, to keep it going). If the most recent activity is
 * older than yesterday, the current streak is 0.
 */
export function computeStreaks(activeDateKeys: string[], todayKey: string, yesterdayKey: string): StreakResult {
  const sorted = [...new Set(activeDateKeys)].sort();
  if (sorted.length === 0) return { currentStreak: 0, longestStreak: 0, activeDays: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const cur = new Date(sorted[i] + "T00:00:00Z");
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diffDays === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const mostRecent = sorted[sorted.length - 1];
  let currentStreak = 0;
  if (mostRecent === todayKey || mostRecent === yesterdayKey) {
    // Walk backward from the most recent active day counting consecutive days.
    let cursor = mostRecent;
    const set = new Set(sorted);
    while (set.has(cursor)) {
      currentStreak++;
      const [y, m, d] = cursor.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - 1);
      cursor = dt.toISOString().slice(0, 10);
    }
  }

  return { currentStreak, longestStreak: longest, activeDays: sorted.length };
}
