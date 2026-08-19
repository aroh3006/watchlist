import { prisma } from "@/lib/prisma";

/** Gathers every piece of a user's own data for export, profile through import history. */
export async function gatherUserExport(userId: string) {
  const [
    user,
    profile,
    userShows,
    userMovies,
    episodeWatches,
    movieWatches,
    ratings,
    favorites,
    lists,
    listItems,
    badges,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, username: true, createdAt: true } }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userShow.findMany({ where: { userId }, include: { show: { select: { title: true, slug: true } } } }),
    prisma.userMovie.findMany({ where: { userId }, include: { movie: { select: { title: true, slug: true } } } }),
    prisma.episodeWatch.findMany({
      where: { userId },
      include: { episode: { select: { episodeNumber: true, title: true, season: { select: { seasonNumber: true, show: { select: { title: true, slug: true } } } } } } },
    }),
    prisma.movieWatch.findMany({ where: { userId }, include: { movie: { select: { title: true, slug: true } } } }),
    prisma.rating.findMany({ where: { userId } }),
    prisma.favorite.findMany({ where: { userId }, include: { show: { select: { title: true } }, movie: { select: { title: true } } } }),
    prisma.customList.findMany({ where: { userId } }),
    prisma.customListItem.findMany({
      where: { list: { userId } },
      include: { show: { select: { title: true } }, movie: { select: { title: true } }, list: { select: { name: true } } },
    }),
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
  ]);

  return {
    profile: {
      email: user.email,
      username: user.username,
      joined: user.createdAt.toISOString(),
      displayName: profile?.displayName,
      bio: profile?.bio,
      timezone: profile?.timezone,
    },
    shows: userShows.map((s) => ({ title: s.show.title, slug: s.show.slug, status: s.status, addedAt: s.addedAt.toISOString() })),
    movies: userMovies.map((m) => ({ title: m.movie.title, slug: m.movie.slug, status: m.status, addedAt: m.addedAt.toISOString() })),
    episodeWatches: episodeWatches.map((w) => ({
      show: w.episode.season.show.title,
      season: w.episode.season.seasonNumber,
      episode: w.episode.episodeNumber,
      episodeTitle: w.episode.title,
      watchedAt: w.watchedAt.toISOString(),
      source: w.source,
    })),
    movieWatches: movieWatches.map((w) => ({ movie: w.movie.title, watchedAt: w.watchedAt.toISOString(), source: w.source })),
    ratings: ratings.map((r) => ({ targetType: r.targetType, showId: r.showId, episodeId: r.episodeId, movieId: r.movieId, score: r.score })),
    favorites: favorites.map((f) => ({ type: f.targetType, title: f.show?.title ?? f.movie?.title ?? "" })),
    lists: lists.map((l) => ({ name: l.name, description: l.description, isPublic: l.isPublic })),
    listItems: listItems.map((i) => ({ list: i.list.name, title: i.show?.title ?? i.movie?.title ?? "" })),
    badges: badges.map((b) => ({ name: b.badge.name, earnedAt: b.earnedAt.toISOString() })),
  };
}

export type UserExport = Awaited<ReturnType<typeof gatherUserExport>>;
