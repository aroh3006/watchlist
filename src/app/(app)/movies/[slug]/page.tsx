import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ShowActions } from "@/components/ShowActions";
import { AddToListButton } from "@/components/AddToListButton";
import { BackButton } from "@/components/BackButton";
import { ReactionBar } from "@/components/ReactionBar";
import { PosterRow, PosterCard } from "@/components/PosterCard";
import { Section } from "@/components/Section";
import type { ReactionType } from "@/lib/constants";

export default async function MovieDetailPage({ params }: { params: { slug: string } }) {
  const user = await requireUser();
  const movie = await prisma.movie.findUnique({
    where: { slug: params.slug },
    include: {
      genres: { include: { genre: true } },
      cast: { include: { person: true, character: true }, orderBy: { billingOrder: "asc" }, take: 12 },
    },
  });
  if (!movie) notFound();

  const [userMovie, favorite, rating, watch, reaction] = await Promise.all([
    prisma.userMovie.findUnique({ where: { userId_movieId: { userId: user.id, movieId: movie.id } } }),
    prisma.favorite.findFirst({ where: { userId: user.id, targetType: "MOVIE", showId: null, movieId: movie.id } }),
    prisma.rating.findFirst({ where: { userId: user.id, targetType: "MOVIE", showId: null, episodeId: null, movieId: movie.id } }),
    prisma.movieWatch.findFirst({ where: { userId: user.id, movieId: movie.id } }),
    prisma.reaction.findFirst({ where: { userId: user.id, movieId: movie.id } }),
  ]);

  const director = movie.cast.find((c) => c.role === "director");
  const similarMovies = await prisma.movie.findMany({
    where: {
      id: { not: movie.id },
      genres: { some: { genreId: { in: movie.genres.map((g) => g.genreId) } } },
      externalIds: { some: { provider: "tmdb" } },
    },
    take: 8,
  });

  return (
    <div>
      <div className="relative h-56 md:h-72 w-full overflow-hidden">
        {movie.backdropUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.backdropUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <BackButton className="absolute top-3 left-3 md:top-4 md:left-4" />
      </div>

      <div className="px-4 md:px-8 -mt-16 relative flex flex-col md:flex-row gap-6">
        <div className="w-32 md:w-48 shrink-0 rounded-xl2 overflow-hidden border border-border shadow-card">
          {movie.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-2 md:pt-16">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{movie.title}</h1>
          <p className="text-sm text-ink-muted mt-1 flex flex-wrap gap-x-2 gap-y-1">
            {movie.releaseDate && <span>{movie.releaseDate.getFullYear()}</span>}
            {movie.runtime && <span>· {movie.runtime}m</span>}
            {director && <span>· Directed by {director.person.name}</span>}
            {movie.voteAverage ? <span>· ★ {movie.voteAverage.toFixed(1)}</span> : null}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {movie.genres.map((g) => (
              <span key={g.genreId} className="text-xs px-2 py-0.5 rounded-full bg-bg-overlay text-ink-muted border border-border-subtle">
                {g.genre.name}
              </span>
            ))}
          </div>
          <p className="text-sm text-ink-muted mt-3 max-w-2xl">{movie.synopsis}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ShowActions
              showId={movie.id}
              kind="movie"
              initialStatus={userMovie?.status}
              initialFavorited={!!favorite}
              initialRating={rating?.score}
            />
            <AddToListButton movieId={movie.id} />
          </div>
          {watch && (
            <div className="mt-4">
              <h2 className="text-sm font-semibold mb-2">Your reaction</h2>
              <ReactionBar target="movie" targetId={movie.id} initialReaction={reaction?.type as ReactionType | null} />
            </div>
          )}
        </div>
      </div>

      {movie.cast.length > 0 && (
        <div className="px-4 md:px-8 mt-8">
          <h2 className="text-base font-semibold mb-3">Cast &amp; Crew</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {movie.cast.map((c) => (
              <div key={c.id} className="shrink-0 w-24 text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-bg-overlay border border-border-subtle">
                  {c.person.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.person.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-xs font-medium mt-1.5 truncate">{c.person.name}</p>
                <p className="text-[11px] text-ink-faint truncate">{c.character?.name ?? c.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {similarMovies.length > 0 && (
        <div className="mt-8">
          <Section title="Similar Movies">
            <PosterRow>
              {similarMovies.map((m) => (
                <PosterCard key={m.id} href={`/movies/${m.slug}`} title={m.title} posterUrl={m.posterUrl} />
              ))}
            </PosterRow>
          </Section>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}
