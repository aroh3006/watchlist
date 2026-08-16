import { prisma } from "@/lib/prisma";

/**
 * Deterministic content-based recommender. Scores unwatched shows/movies by
 * genre overlap with the user's favorited/completed/highly-rated titles,
 * weighted by popularity as a tiebreaker. Structured so a learned/ML model
 * could replace `scoreCandidates` later without touching callers.
 */
export async function recommendShows(userId: string, limit = 10) {
  const [likedShowGenres, trackedShowIds] = await Promise.all([
    prisma.showGenre.findMany({
      where: {
        show: {
          OR: [
            { userShows: { some: { userId, status: { in: ["COMPLETED", "WATCHING"] } } } },
            { listItems: { some: { list: { userId } } } },
          ],
        },
      },
      select: { genreId: true },
    }),
    prisma.userShow.findMany({ where: { userId }, select: { showId: true } }),
  ]);

  const genreWeight = new Map<string, number>();
  for (const g of likedShowGenres) genreWeight.set(g.genreId, (genreWeight.get(g.genreId) ?? 0) + 1);
  const trackedIds = new Set(trackedShowIds.map((s) => s.showId));

  const candidates = await prisma.show.findMany({
    where: { id: { notIn: Array.from(trackedIds) }, externalIds: { some: { provider: "tmdb" } } },
    include: { genres: true },
    take: 200,
  });

  const scored = candidates
    .map((show) => {
      const genreScore = show.genres.reduce((sum, sg) => sum + (genreWeight.get(sg.genreId) ?? 0), 0);
      return { show, score: genreScore * 10 + show.popularity / 10 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.show);
}

export async function recommendMovies(userId: string, limit = 10) {
  const [likedMovieGenres, trackedMovieIds] = await Promise.all([
    prisma.movieGenre.findMany({
      where: {
        movie: {
          OR: [
            { userMovies: { some: { userId, status: "COMPLETED" } } },
            { listItems: { some: { list: { userId } } } },
          ],
        },
      },
      select: { genreId: true },
    }),
    prisma.userMovie.findMany({ where: { userId }, select: { movieId: true } }),
  ]);

  const genreWeight = new Map<string, number>();
  for (const g of likedMovieGenres) genreWeight.set(g.genreId, (genreWeight.get(g.genreId) ?? 0) + 1);
  const trackedIds = new Set(trackedMovieIds.map((m) => m.movieId));

  const candidates = await prisma.movie.findMany({
    where: { id: { notIn: Array.from(trackedIds) }, externalIds: { some: { provider: "tmdb" } } },
    include: { genres: true },
    take: 200,
  });

  const scored = candidates
    .map((movie) => {
      const genreScore = movie.genres.reduce((sum, mg) => sum + (genreWeight.get(mg.genreId) ?? 0), 0);
      return { movie, score: genreScore * 10 + movie.popularity / 10 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((m) => m.movie);
}
