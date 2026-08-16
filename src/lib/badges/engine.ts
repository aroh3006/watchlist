import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS, type BadgeRule } from "./definitions";
import { computeStreaks } from "@/lib/stats/activity";
import { dateKeyInTimezone, todayKeyInTimezone, addDaysToKey } from "@/lib/time";

export interface UserSignals {
  episodesWatched: number;
  moviesWatched: number;
  showsCompleted: number;
  seasonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  genresExplored: number;
  listsCreated: number;
  maxEpisodesInSingleDay: number;
  hasFavorite: boolean;
}

async function gatherSignals(userId: string): Promise<UserSignals> {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const timeZone = profile?.timezone ?? "UTC";

  const [episodeWatches, movieWatches, userShows, favorite, lists, activity] = await Promise.all([
    prisma.episodeWatch.findMany({ where: { userId }, select: { watchedAt: true, episode: { select: { showId: true } } } }),
    prisma.movieWatch.count({ where: { userId } }),
    prisma.userShow.findMany({ where: { userId, status: "COMPLETED" }, select: { showId: true } }),
    prisma.favorite.findFirst({ where: { userId } }),
    prisma.customList.count({ where: { userId } }),
    prisma.dailyWatchActivity.findMany({ where: { userId }, select: { date: true, episodeCount: true } }),
  ]);

  const genreShowIds = new Set(episodeWatches.map((w) => w.episode.showId));
  const genreCount = genreShowIds.size
    ? await prisma.showGenre.findMany({
        where: { showId: { in: Array.from(genreShowIds) } },
        select: { genreId: true },
        distinct: ["genreId"],
      })
    : [];

  // Completed seasons: a season counts complete if every episode in it has a watch event.
  const showIdsWithWatches = Array.from(genreShowIds);
  let seasonsCompleted = 0;
  if (showIdsWithWatches.length > 0) {
    const seasons = await prisma.season.findMany({
      where: { showId: { in: showIdsWithWatches } },
      include: { episodes: { select: { id: true } } },
    });
    const watchedEpisodeIds = new Set(
      (await prisma.episodeWatch.findMany({ where: { userId }, select: { episodeId: true } })).map((w) => w.episodeId)
    );
    for (const season of seasons) {
      if (season.episodes.length > 0 && season.episodes.every((e) => watchedEpisodeIds.has(e.id))) {
        seasonsCompleted++;
      }
    }
  }

  const today = todayKeyInTimezone(timeZone);
  const yesterday = addDaysToKey(today, -1);
  const streaks = computeStreaks(
    activity.map((a) => a.date),
    today,
    yesterday
  );

  const dayCounts = new Map<string, number>();
  for (const w of episodeWatches) {
    const key = dateKeyInTimezone(w.watchedAt, timeZone);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }
  const maxEpisodesInSingleDay = Math.max(0, ...Array.from(dayCounts.values()));

  return {
    episodesWatched: episodeWatches.length,
    moviesWatched: movieWatches,
    showsCompleted: userShows.length,
    seasonsCompleted,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    genresExplored: genreCount.length,
    listsCreated: lists,
    maxEpisodesInSingleDay,
    hasFavorite: !!favorite,
  };
}

export function ruleSatisfied(rule: BadgeRule, s: UserSignals): boolean {
  switch (rule.kind) {
    case "episodesWatched":
      return s.episodesWatched >= rule.threshold;
    case "moviesWatched":
      return s.moviesWatched >= rule.threshold;
    case "showsCompleted":
      return s.showsCompleted >= rule.threshold;
    case "seasonsCompleted":
      return s.seasonsCompleted >= rule.threshold;
    case "currentStreak":
      return s.currentStreak >= rule.threshold;
    case "longestStreak":
      return s.longestStreak >= rule.threshold;
    case "genresExplored":
      return s.genresExplored >= rule.threshold;
    case "listsCreated":
      return s.listsCreated >= rule.threshold;
    case "episodesInSingleDay":
      return s.maxEpisodesInSingleDay >= rule.threshold;
    case "firstEpisodeWatched":
      return s.episodesWatched >= 1;
    case "firstMovieWatched":
      return s.moviesWatched >= 1;
    case "firstShowCompleted":
      return s.showsCompleted >= 1;
    case "firstFavorite":
      return s.hasFavorite;
  }
}

/**
 * Evaluates every badge rule against the user's current stats and awards
 * any newly-earned badges. Idempotent — already-earned badges are skipped.
 * Returns the list of badge keys newly awarded (useful for notifications).
 */
export async function evaluateBadgesForUser(userId: string): Promise<string[]> {
  const signals = await gatherSignals(userId);
  const earned = new Set(
    (await prisma.userBadge.findMany({ where: { userId }, select: { badge: { select: { key: true } } } })).map(
      (b) => b.badge.key
    )
  );

  const newlyAwarded: string[] = [];
  for (const def of BADGE_DEFINITIONS) {
    if (earned.has(def.key)) continue;
    if (ruleSatisfied(def.rule, signals)) {
      const badge = await prisma.badge.findUnique({ where: { key: def.key } });
      if (!badge) continue;
      await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
      await prisma.notification.create({
        data: {
          userId,
          type: "BADGE_EARNED",
          title: `Badge earned: ${def.name}`,
          body: def.description,
        },
      });
      newlyAwarded.push(def.key);
    }
  }
  return newlyAwarded;
}
