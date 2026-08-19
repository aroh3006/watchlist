import type {
  MetadataProvider,
  MetaShowSummary,
  MetaShowDetail,
  MetaMovieSummary,
  MetaMovieDetail,
  MetaPerson,
  SearchOptions,
} from "./types";
import { SEED_SHOWS, SEED_MOVIES, type SeedShow, type SeedMovie } from "./localData";
import { posterPlaceholder, backdropPlaceholder } from "./placeholderImage";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function showToSummary(s: SeedShow): MetaShowSummary {
  return {
    externalId: s.id,
    provider: "local",
    title: s.title,
    posterUrl: posterPlaceholder(s.posterHue, s.title),
    backdropUrl: backdropPlaceholder(s.posterHue, s.title),
    firstAirDate: s.firstAirDate,
    status: s.status,
    popularity: s.popularity,
    voteAverage: s.voteAverage,
    genres: s.genres.map((g) => ({ name: g, slug: slugify(g) })),
  };
}

function showToDetail(s: SeedShow): MetaShowDetail {
  return {
    ...showToSummary(s),
    description: s.description,
    lastAirDate: s.lastAirDate,
    episodeRuntime: s.episodeRuntime,
    language: s.language,
    country: s.country,
    network: { name: s.network, slug: slugify(s.network) },
    cast: s.cast.map((c) => ({
      person: { externalId: `person-${slugify(c.name)}`, name: c.name },
      character: c.character,
      role: c.role,
    })),
    seasons: s.seasons.map((season, idx) => ({
      externalId: `${s.id}-s${idx + 1}`,
      seasonNumber: idx + 1,
      title: season.title,
      overview: season.overview,
      posterUrl: posterPlaceholder(s.posterHue, `${s.title} ${season.title}`),
      episodes: season.episodes.map((ep, epIdx) => ({
        externalId: `${s.id}-s${idx + 1}e${epIdx + 1}`,
        seasonNumber: idx + 1,
        episodeNumber: epIdx + 1,
        title: ep.title,
        overview: ep.overview,
        runtime: ep.runtime,
        imageUrl: backdropPlaceholder(s.posterHue, ep.title),
      })),
    })),
    externalIds: { local: s.id },
  };
}

function movieToSummary(m: SeedMovie): MetaMovieSummary {
  return {
    externalId: m.id,
    provider: "local",
    title: m.title,
    posterUrl: posterPlaceholder(m.posterHue, m.title),
    backdropUrl: backdropPlaceholder(m.posterHue, m.title),
    releaseDate: m.releaseDate,
    popularity: m.popularity,
    voteAverage: m.voteAverage,
    genres: m.genres.map((g) => ({ name: g, slug: slugify(g) })),
  };
}

function movieToDetail(m: SeedMovie): MetaMovieDetail {
  return {
    ...movieToSummary(m),
    synopsis: m.synopsis,
    runtime: m.runtime,
    language: m.language,
    country: m.country,
    cast: m.cast.map((c) => ({
      person: { externalId: `person-${slugify(c.name)}`, name: c.name },
      character: c.character,
      role: c.role,
    })),
    externalIds: { local: m.id },
  };
}

/**
 * Ships-with-Watchlist metadata source. Entirely original fictional
 * content. No external network calls, no proprietary data. This is the
 * default provider so the app is fully usable offline out of the box.
 */
export class LocalDatasetProvider implements MetadataProvider {
  readonly id = "local";

  async searchShows({ query, limit = 20 }: SearchOptions): Promise<MetaShowSummary[]> {
    const q = query.trim().toLowerCase();
    const results = SEED_SHOWS.filter(
      (s) =>
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.genres.some((g) => g.toLowerCase().includes(q)) ||
        s.cast.some((c) => c.name.toLowerCase().includes(q) || c.character?.toLowerCase().includes(q))
    );
    return results.slice(0, limit).map(showToSummary);
  }

  async getShow(externalId: string): Promise<MetaShowDetail | null> {
    const s = SEED_SHOWS.find((x) => x.id === externalId);
    return s ? showToDetail(s) : null;
  }

  async searchMovies({ query, limit = 20 }: SearchOptions): Promise<MetaMovieSummary[]> {
    const q = query.trim().toLowerCase();
    const results = SEED_MOVIES.filter(
      (m) =>
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q)) ||
        m.cast.some((c) => c.name.toLowerCase().includes(q) || c.character?.toLowerCase().includes(q))
    );
    return results.slice(0, limit).map(movieToSummary);
  }

  async getMovie(externalId: string): Promise<MetaMovieDetail | null> {
    const m = SEED_MOVIES.find((x) => x.id === externalId);
    return m ? movieToDetail(m) : null;
  }

  async getPerson(externalId: string): Promise<MetaPerson | null> {
    for (const s of SEED_SHOWS) {
      const c = s.cast.find((c) => `person-${slugify(c.name)}` === externalId);
      if (c) return { externalId, name: c.name };
    }
    for (const m of SEED_MOVIES) {
      const c = m.cast.find((c) => `person-${slugify(c.name)}` === externalId);
      if (c) return { externalId, name: c.name };
    }
    return null;
  }

  async trending() {
    const shows = [...SEED_SHOWS].sort((a, b) => b.popularity - a.popularity).slice(0, 8).map(showToSummary);
    const movies = [...SEED_MOVIES].sort((a, b) => b.popularity - a.popularity).slice(0, 8).map(movieToSummary);
    return { shows, movies };
  }
}
