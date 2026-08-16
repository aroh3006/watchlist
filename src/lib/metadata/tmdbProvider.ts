import type {
  MetadataProvider,
  MetaShowSummary,
  MetaShowDetail,
  MetaMovieSummary,
  MetaMovieDetail,
  MetaPerson,
  SearchOptions,
} from "./types";

const IMG_BASE = "https://image.tmdb.org/t/p";

/**
 * Adapter for The Movie Database (TMDB) API — an openly licensed metadata
 * source (https://www.themoviedb.org/documentation/api) usable as a legal
 * stand-in for TheTVDB's historical role in TV Time. Requires
 * METADATA_TMDB_API_KEY. This class is the *only* place in the codebase
 * that knows about TMDB's REST shape; everything else consumes the
 * provider-agnostic MetadataProvider interface.
 */
export class TmdbProvider implements MetadataProvider {
  readonly id = "tmdb";
  private apiKey: string;
  private base = "https://api.themoviedb.org/3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(this.base + path);
    url.searchParams.set("api_key", this.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    // Next.js defaults an unconfigured fetch() to force-cache, which would
    // silently serve stale TMDB data indefinitely — even on pages that
    // otherwise render dynamically (dynamic rendering and fetch caching are
    // independent). Revalidate hourly instead of caching forever.
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`TMDB request failed: ${res.status} ${path}`);
    return res.json() as Promise<T>;
  }

  async searchShows({ query, limit = 20 }: SearchOptions): Promise<MetaShowSummary[]> {
    const data = await this.get<{ results: any[] }>("/search/tv", { query });
    return data.results.slice(0, limit).map((r) => this.showSummary(r));
  }

  async getShow(externalId: string): Promise<MetaShowDetail | null> {
    try {
      const [show, credits, external] = await Promise.all([
        this.get<any>(`/tv/${externalId}`),
        this.get<any>(`/tv/${externalId}/credits`),
        this.get<any>(`/tv/${externalId}/external_ids`),
      ]);
      const seasons = await Promise.all(
        (show.seasons ?? [])
          .filter((s: any) => s.season_number > 0)
          .map(async (s: any) => {
            const detail = await this.get<any>(`/tv/${externalId}/season/${s.season_number}`);
            return {
              externalId: String(detail.id),
              seasonNumber: s.season_number,
              title: detail.name,
              overview: detail.overview,
              posterUrl: detail.poster_path ? `${IMG_BASE}/w500${detail.poster_path}` : undefined,
              airDate: detail.air_date,
              episodes: (detail.episodes ?? []).map((e: any) => ({
                externalId: String(e.id),
                seasonNumber: e.season_number,
                episodeNumber: e.episode_number,
                title: e.name,
                overview: e.overview,
                airDate: e.air_date,
                runtime: e.runtime,
                imageUrl: e.still_path ? `${IMG_BASE}/w300${e.still_path}` : undefined,
                voteAverage: e.vote_average,
              })),
            };
          })
      );
      return {
        ...this.showSummary(show),
        description: show.overview,
        lastAirDate: show.last_air_date,
        episodeRuntime: show.episode_run_time?.[0],
        language: show.original_language,
        country: show.origin_country?.[0],
        network: show.networks?.[0] ? { name: show.networks[0].name, slug: String(show.networks[0].id) } : undefined,
        cast: (credits.cast ?? []).slice(0, 15).map((c: any) => ({
          person: { externalId: String(c.id), name: c.name, imageUrl: c.profile_path ? `${IMG_BASE}/w200${c.profile_path}` : undefined },
          character: c.character,
          role: "actor" as const,
          billingOrder: c.order,
        })),
        seasons,
        externalIds: {
          tmdb: String(show.id),
          ...(external.imdb_id ? { imdb: external.imdb_id } : {}),
          ...(external.tvdb_id ? { tvdb: String(external.tvdb_id) } : {}),
        },
      };
    } catch {
      return null;
    }
  }

  async searchMovies({ query, limit = 20 }: SearchOptions): Promise<MetaMovieSummary[]> {
    const data = await this.get<{ results: any[] }>("/search/movie", { query });
    return data.results.slice(0, limit).map((r) => this.movieSummary(r));
  }

  async getMovie(externalId: string): Promise<MetaMovieDetail | null> {
    try {
      const [movie, credits, external] = await Promise.all([
        this.get<any>(`/movie/${externalId}`),
        this.get<any>(`/movie/${externalId}/credits`),
        this.get<any>(`/movie/${externalId}/external_ids`),
      ]);
      return {
        ...this.movieSummary(movie),
        synopsis: movie.overview,
        runtime: movie.runtime,
        language: movie.original_language,
        country: movie.production_countries?.[0]?.iso_3166_1,
        cast: (credits.cast ?? []).slice(0, 15).map((c: any) => ({
          person: { externalId: String(c.id), name: c.name, imageUrl: c.profile_path ? `${IMG_BASE}/w200${c.profile_path}` : undefined },
          character: c.character,
          role: "actor" as const,
          billingOrder: c.order,
        })),
        externalIds: {
          tmdb: String(movie.id),
          ...(external.imdb_id ? { imdb: external.imdb_id } : {}),
        },
      };
    } catch {
      return null;
    }
  }

  async getPerson(externalId: string): Promise<MetaPerson | null> {
    try {
      const p = await this.get<any>(`/person/${externalId}`);
      return {
        externalId: String(p.id),
        name: p.name,
        imageUrl: p.profile_path ? `${IMG_BASE}/w300${p.profile_path}` : undefined,
        bio: p.biography,
      };
    } catch {
      return null;
    }
  }

  async trending() {
    const [tv, movies] = await Promise.all([
      this.get<{ results: any[] }>("/trending/tv/week"),
      this.get<{ results: any[] }>("/trending/movie/week"),
    ]);
    return {
      shows: tv.results.slice(0, 8).map((r) => this.showSummary(r)),
      movies: movies.results.slice(0, 8).map((r) => this.movieSummary(r)),
    };
  }

  private showSummary(r: any): MetaShowSummary {
    return {
      externalId: String(r.id),
      provider: "tmdb",
      title: r.name,
      originalTitle: r.original_name,
      posterUrl: r.poster_path ? `${IMG_BASE}/w500${r.poster_path}` : undefined,
      backdropUrl: r.backdrop_path ? `${IMG_BASE}/w1280${r.backdrop_path}` : undefined,
      firstAirDate: r.first_air_date,
      status: r.status,
      popularity: r.popularity,
      voteAverage: r.vote_average,
      genres: (r.genres ?? []).map((g: any) => ({ name: g.name, slug: String(g.id) })),
    };
  }

  private movieSummary(r: any): MetaMovieSummary {
    return {
      externalId: String(r.id),
      provider: "tmdb",
      title: r.title,
      originalTitle: r.original_title,
      posterUrl: r.poster_path ? `${IMG_BASE}/w500${r.poster_path}` : undefined,
      backdropUrl: r.backdrop_path ? `${IMG_BASE}/w1280${r.backdrop_path}` : undefined,
      releaseDate: r.release_date,
      popularity: r.popularity,
      voteAverage: r.vote_average,
      genres: (r.genres ?? []).map((g: any) => ({ name: g.name, slug: String(g.id) })),
    };
  }
}
