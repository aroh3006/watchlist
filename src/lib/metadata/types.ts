/**
 * Provider-agnostic metadata shapes. The rest of the application only ever
 * talks to these types — never to a specific provider's response shape.
 * This is what lets Watchlist swap TheTVDB/TMDB/a future licensed dataset
 * in and out without touching UI or database code.
 */

export interface MetaGenre {
  name: string;
  slug: string;
}

export interface MetaPerson {
  externalId: string;
  name: string;
  imageUrl?: string;
  bio?: string;
}

export interface MetaCastMember {
  person: MetaPerson;
  character?: string;
  role: "actor" | "creator" | "director" | "writer";
  billingOrder?: number;
}

export interface MetaShowSummary {
  externalId: string;
  provider: string;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  firstAirDate?: string;
  status?: string;
  popularity?: number;
  voteAverage?: number;
  genres?: MetaGenre[];
}

export interface MetaEpisode {
  externalId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  airDate?: string;
  runtime?: number;
  imageUrl?: string;
  voteAverage?: number;
}

export interface MetaSeason {
  externalId: string;
  seasonNumber: number;
  title?: string;
  overview?: string;
  posterUrl?: string;
  airDate?: string;
  episodes: MetaEpisode[];
}

export interface MetaShowDetail extends MetaShowSummary {
  description?: string;
  lastAirDate?: string;
  episodeRuntime?: number;
  language?: string;
  country?: string;
  network?: { name: string; slug: string; logoUrl?: string };
  cast?: MetaCastMember[];
  seasons: MetaSeason[];
  externalIds?: Record<string, string>; // provider -> id, e.g. { imdb: "tt123", tvdb: "456" }
}

export interface MetaMovieSummary {
  externalId: string;
  provider: string;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  popularity?: number;
  voteAverage?: number;
  genres?: MetaGenre[];
}

export interface MetaMovieDetail extends MetaMovieSummary {
  synopsis?: string;
  runtime?: number;
  language?: string;
  country?: string;
  cast?: MetaCastMember[];
  externalIds?: Record<string, string>;
}

export interface SearchOptions {
  query: string;
  limit?: number;
}

/**
 * Every metadata source (local seed dataset, TMDB, a future licensed
 * provider) implements this contract. Application code depends only on
 * this interface, never on a specific provider's SDK or REST shape.
 */
export interface MetadataProvider {
  readonly id: string;
  searchShows(opts: SearchOptions): Promise<MetaShowSummary[]>;
  getShow(externalId: string): Promise<MetaShowDetail | null>;
  searchMovies(opts: SearchOptions): Promise<MetaMovieSummary[]>;
  getMovie(externalId: string): Promise<MetaMovieDetail | null>;
  getPerson(externalId: string): Promise<MetaPerson | null>;
  trending(): Promise<{ shows: MetaShowSummary[]; movies: MetaMovieSummary[] }>;
}
