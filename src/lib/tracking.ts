import { prisma } from "@/lib/prisma";
import { recomputeDailyActivityForUser } from "@/lib/stats/activity";
import { evaluateBadgesForUser } from "@/lib/badges/engine";
import crypto from "crypto";

function stableDedupeKey(parts: (string | number)[]): string {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

/** Runs after any watch-state mutation to keep derived caches in sync. */
async function afterWatchChange(userId: string) {
  await recomputeDailyActivityForUser(userId);
  await evaluateBadgesForUser(userId);
}

export async function markEpisodeWatched(userId: string, episodeId: string, watchedAt: Date = new Date()) {
  const episode = await prisma.episode.findUniqueOrThrow({ where: { id: episodeId } });
  const dedupeKey = stableDedupeKey([userId, "episode", episodeId, watchedAt.toISOString(), "manual"]);

  const watch = await prisma.episodeWatch.create({
    data: { userId, episodeId, watchedAt, source: "manual", dedupeKey },
  });

  await prisma.userShow.upsert({
    where: { userId_showId: { userId, showId: episode.showId } },
    update: { status: "WATCHING" },
    create: { userId, showId: episode.showId, status: "WATCHING" },
  });

  await maybeCompleteShow(userId, episode.showId);
  await afterWatchChange(userId);
  return watch;
}

export async function unmarkEpisodeWatched(userId: string, episodeId: string) {
  await prisma.episodeWatch.deleteMany({ where: { userId, episodeId } });
  const episode = await prisma.episode.findUniqueOrThrow({ where: { id: episodeId } });
  const userShow = await prisma.userShow.findUnique({ where: { userId_showId: { userId, showId: episode.showId } } });
  if (userShow?.status === "COMPLETED") {
    await prisma.userShow.update({ where: { id: userShow.id }, data: { status: "WATCHING" } });
  }
  await afterWatchChange(userId);
}

export async function markSeasonWatched(userId: string, seasonId: string) {
  const season = await prisma.season.findUniqueOrThrow({ where: { id: seasonId }, include: { episodes: true } });
  const existing = await prisma.episodeWatch.findMany({
    where: { userId, episodeId: { in: season.episodes.map((e) => e.id) } },
    select: { episodeId: true },
  });
  const watchedIds = new Set(existing.map((e) => e.episodeId));
  const now = new Date();

  await prisma.$transaction(
    season.episodes
      .filter((e) => !watchedIds.has(e.id))
      .map((e, i) => {
        const watchedAt = new Date(now.getTime() + i);
        return prisma.episodeWatch.create({
          data: {
            userId,
            episodeId: e.id,
            watchedAt,
            source: "manual",
            dedupeKey: stableDedupeKey([userId, "episode", e.id, watchedAt.toISOString(), "manual-season"]),
          },
        });
      })
  );

  await prisma.userShow.upsert({
    where: { userId_showId: { userId, showId: season.showId } },
    update: { status: "WATCHING" },
    create: { userId, showId: season.showId, status: "WATCHING" },
  });
  await maybeCompleteShow(userId, season.showId);
  await afterWatchChange(userId);
}

export async function markShowWatched(userId: string, showId: string) {
  const episodes = await prisma.episode.findMany({ where: { showId }, select: { id: true } });
  const existing = await prisma.episodeWatch.findMany({
    where: { userId, episodeId: { in: episodes.map((e) => e.id) } },
    select: { episodeId: true },
  });
  const watchedIds = new Set(existing.map((e) => e.episodeId));
  const now = new Date();

  await prisma.$transaction(
    episodes
      .filter((e) => !watchedIds.has(e.id))
      .map((e, i) => {
        const watchedAt = new Date(now.getTime() + i);
        return prisma.episodeWatch.create({
          data: {
            userId,
            episodeId: e.id,
            watchedAt,
            source: "manual",
            dedupeKey: stableDedupeKey([userId, "episode", e.id, watchedAt.toISOString(), "manual-show"]),
          },
        });
      })
  );

  await prisma.userShow.upsert({
    where: { userId_showId: { userId, showId } },
    update: { status: "COMPLETED" },
    create: { userId, showId, status: "COMPLETED" },
  });
  await afterWatchChange(userId);
}

async function maybeCompleteShow(userId: string, showId: string) {
  const totalEpisodes = await prisma.episode.count({ where: { showId } });
  if (totalEpisodes === 0) return;
  const watchedCount = await prisma.episodeWatch.count({
    where: { userId, episode: { showId } },
  });
  if (watchedCount >= totalEpisodes) {
    await prisma.userShow.updateMany({ where: { userId, showId }, data: { status: "COMPLETED" } });
  }
}

export async function markMovieWatched(userId: string, movieId: string, watchedAt: Date = new Date()) {
  const dedupeKey = stableDedupeKey([userId, "movie", movieId, watchedAt.toISOString(), "manual"]);
  const watch = await prisma.movieWatch.create({
    data: { userId, movieId, watchedAt, source: "manual", dedupeKey },
  });
  await prisma.userMovie.upsert({
    where: { userId_movieId: { userId, movieId } },
    update: { status: "COMPLETED" },
    create: { userId, movieId, status: "COMPLETED" },
  });
  await afterWatchChange(userId);
  return watch;
}

export async function unmarkMovieWatched(userId: string, movieId: string) {
  await prisma.movieWatch.deleteMany({ where: { userId, movieId } });
  await prisma.userMovie.updateMany({ where: { userId, movieId }, data: { status: "PLANNED" } });
  await afterWatchChange(userId);
}

export async function setShowStatus(userId: string, showId: string, status: string) {
  return prisma.userShow.upsert({
    where: { userId_showId: { userId, showId } },
    update: { status },
    create: { userId, showId, status },
  });
}

export async function setMovieStatus(userId: string, movieId: string, status: string) {
  return prisma.userMovie.upsert({
    where: { userId_movieId: { userId, movieId } },
    update: { status },
    create: { userId, movieId, status },
  });
}

// SQLite's Prisma connector rejects `null` inside a composite-unique
// `where` (uniqueness across NULLs is provider-dependent), so favorite/
// rating lookups use findFirst + create/update instead of upsert here.

export async function toggleFavorite(userId: string, targetType: "SHOW" | "MOVIE", id: string) {
  const existing = await prisma.favorite.findFirst({
    where: {
      userId,
      targetType,
      showId: targetType === "SHOW" ? id : null,
      movieId: targetType === "MOVIE" ? id : null,
    },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }
  await prisma.favorite.create({
    data: { userId, targetType, showId: targetType === "SHOW" ? id : null, movieId: targetType === "MOVIE" ? id : null },
  });
  await evaluateBadgesForUser(userId);
  return { favorited: true };
}

export async function rate(userId: string, targetType: "SHOW" | "EPISODE" | "MOVIE", id: string, score: number) {
  if (score < 1 || score > 10) throw new Error("Rating must be between 1 and 10");
  const filter = {
    userId,
    targetType,
    showId: targetType === "SHOW" ? id : null,
    episodeId: targetType === "EPISODE" ? id : null,
    movieId: targetType === "MOVIE" ? id : null,
  };
  const existing = await prisma.rating.findFirst({ where: filter });
  if (existing) return prisma.rating.update({ where: { id: existing.id }, data: { score } });
  return prisma.rating.create({ data: { ...filter, score } });
}

/** Progress for a show: episodes watched / total, plus the next unwatched episode. */
export async function getShowProgress(userId: string, showId: string) {
  const episodes = await prisma.episode.findMany({
    where: { showId },
    orderBy: [{ season: { seasonNumber: "asc" } }, { episodeNumber: "asc" }],
    include: { season: true },
  });
  const watches = await prisma.episodeWatch.findMany({
    where: { userId, episode: { showId } },
    select: { episodeId: true },
  });
  const watchedIds = new Set(watches.map((w) => w.episodeId));
  const nextEpisode = episodes.find((e) => !watchedIds.has(e.id)) ?? null;

  return {
    totalEpisodes: episodes.length,
    watchedEpisodes: episodes.filter((e) => watchedIds.has(e.id)).length,
    nextEpisode,
    watchedEpisodeIds: watchedIds,
  };
}
