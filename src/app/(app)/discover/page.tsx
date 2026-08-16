import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getMetadataProvider } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { DiscoverCard } from "@/components/DiscoverCard";
import { PosterCard } from "@/components/PosterCard";
import { Section, EmptyState } from "@/components/Section";

export default async function DiscoverPage({ searchParams }: { searchParams: { q?: string; genre?: string } }) {
  await requireUser();
  const provider = getMetadataProvider();
  const query = searchParams.q?.trim() ?? "";
  const genreSlug = searchParams.genre;

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });

  let searchShows: Awaited<ReturnType<typeof provider.searchShows>> = [];
  let searchMovies: Awaited<ReturnType<typeof provider.searchMovies>> = [];
  if (query) {
    [searchShows, searchMovies] = await Promise.all([
      provider.searchShows({ query, limit: 24 }),
      provider.searchMovies({ query, limit: 24 }),
    ]);
  }

  const trending = await provider.trending();

  let genreShows: { id: string; slug: string; title: string; posterUrl: string | null }[] = [];
  let genreMovies: { id: string; slug: string; title: string; posterUrl: string | null }[] = [];
  if (genreSlug) {
    const genre = genres.find((g) => g.slug === genreSlug);
    if (genre) {
      genreShows = await prisma.show.findMany({
        where: { genres: { some: { genreId: genre.id } }, externalIds: { some: { provider: "tmdb" } } },
        take: 24,
      });
      genreMovies = await prisma.movie.findMany({
        where: { genres: { some: { genreId: genre.id } }, externalIds: { some: { provider: "tmdb" } } },
        take: 24,
      });
    }
  }

  return (
    <div className="py-6 md:py-8">
      <div className="px-4 md:px-8 mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">Discover</h1>
        <form action="/discover" className="max-w-lg">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search shows, movies, actors, characters..."
            className="w-full rounded-lg bg-bg-overlay border border-border px-4 py-2.5 text-sm focus-ring"
          />
        </form>
        <div className="flex gap-2 overflow-x-auto mt-10 pb-3">
          <Link
            href="/discover"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors focus-ring ${
              !genreSlug ? "bg-brand-500 border-brand-500 text-white" : "border-border text-ink-muted"
            }`}
          >
            All Genres
          </Link>
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/discover?genre=${g.slug}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-colors focus-ring ${
                genreSlug === g.slug ? "bg-brand-500 border-brand-500 text-white" : "border-border text-ink-muted"
              }`}
            >
              {g.name}
            </Link>
          ))}
        </div>
      </div>

      {query && (
        <Section title={`Results for "${query}"`}>
          {searchShows.length === 0 && searchMovies.length === 0 ? (
            <EmptyState title="No results" body="Try a different title, genre, or actor name." />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {searchShows.map((s) => (
                <DiscoverCard key={s.externalId} title={s.title} posterUrl={s.posterUrl} subtitle="Show" type="show" provider={s.provider} externalId={s.externalId} />
              ))}
              {searchMovies.map((m) => (
                <DiscoverCard key={m.externalId} title={m.title} posterUrl={m.posterUrl} subtitle="Movie" type="movie" provider={m.provider} externalId={m.externalId} />
              ))}
            </div>
          )}
        </Section>
      )}

      {genreSlug && (genreShows.length > 0 || genreMovies.length > 0) && (
        <Section title={`${genres.find((g) => g.slug === genreSlug)?.name ?? "Genre"}`}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {genreShows.map((s) => (
              <PosterCard key={s.id} href={`/shows/${s.slug}`} title={s.title} posterUrl={s.posterUrl} subtitle="Show" />
            ))}
            {genreMovies.map((m) => (
              <PosterCard key={m.id} href={`/movies/${m.slug}`} title={m.title} posterUrl={m.posterUrl} subtitle="Movie" />
            ))}
          </div>
        </Section>
      )}

      {!query && !genreSlug && (
        <>
          <Section title="Trending Shows">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trending.shows.map((s) => (
                <DiscoverCard key={s.externalId} title={s.title} posterUrl={s.posterUrl} subtitle="Show" type="show" provider={s.provider} externalId={s.externalId} />
              ))}
            </div>
          </Section>
          <Section title="Trending Movies">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {trending.movies.map((m) => (
                <DiscoverCard key={m.externalId} title={m.title} posterUrl={m.posterUrl} subtitle="Movie" type="movie" provider={m.provider} externalId={m.externalId} />
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
