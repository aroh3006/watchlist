/**
 * Smart CSV column mapping. TV Time (and similar trackers) exports don't
 * use one fixed schema, so instead of hard-coding column positions we
 * recognize common *aliases* for each logical field and fall back to
 * preserving anything unrecognized rather than discarding it.
 *
 * Movie and show titles are tracked as SEPARATE logical fields rather than
 * one merged "title". Several real TV Time export tables carry both a
 * `movie_name` and a `series_name` column on every row, populating exactly
 * one of them per row depending on what that row is about (the other is
 * blank). Collapsing them into a single title column at the file level
 * would silently drop the correct value for whichever type didn't win.
 * Per-row resolution below picks whichever is actually populated.
 */

const SYNONYMS: Record<string, string[]> = {
  // Deliberately does NOT include a bare "name" alias. That column name is
  // extremely common on unrelated key/value and settings tables in raw
  // exports (e.g. `{id, name, value}` device/app-setting rows), and treating
  // it as a title caused garbage strings to be searched as movie titles.
  genericTitle: ["title"],
  showTitle: ["show", "series", "show_name", "series_name", "tv_show_name", "tvshow_name"],
  movieTitle: ["movie", "movie_name"],
  season: ["season", "season_number", "season_num", "s", "s_no", "episode_season_number"],
  episodeNumber: ["episode", "episode_number", "episode_num", "ep", "e", "ep_no"],
  episodeTitle: ["episode_title", "episode_name"],
  watchedAt: ["watched_at", "watch_date", "date", "watched_date", "created_at", "timestamp"],
  watched: ["watched", "is_watched", "seen"],
  rating: ["rating", "score", "user_rating", "my_rating"],
  favorite: ["favorite", "favourited", "is_favorite", "favorited", "is_favorited"],
  status: ["status", "watch_status", "list_status"],
  type: ["type", "media_type", "content_type"],
  imdbId: ["imdb_id", "imdbid", "imdb"],
  tmdbId: ["tmdb_id", "tmdbid", "tmdb", "themoviedb_id"],
  tvdbId: ["tvdb_id", "tvdbid", "tvdb", "thetvdb_id"],
  listName: ["list", "list_name", "collection"],
};

export type LogicalField = keyof typeof SYNONYMS;

export function buildFieldMap(headers: string[]): Partial<Record<LogicalField, string>> {
  const normalized = (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_");
  const headerByNormalized = new Map(headers.map((h) => [normalized(h), h]));

  const map: Partial<Record<LogicalField, string>> = {};
  for (const [field, aliases] of Object.entries(SYNONYMS) as [LogicalField, string[]][]) {
    for (const alias of aliases) {
      const match = headerByNormalized.get(alias);
      if (match) {
        map[field] = match;
        break;
      }
    }
  }
  return map;
}

export type DetectedFileKind = "episodes" | "movies" | "shows" | "ratings" | "unknown";

export function detectFileKind(headers: string[]): DetectedFileKind {
  const map = buildFieldMap(headers);
  // A file with both movie- and show-title columns carries mixed content.
  // Routing happens per row (see normalizeRow's `type`), not per file.
  if (map.movieTitle && map.showTitle) return "unknown";
  if (map.episodeNumber || map.season) return "episodes";
  if (map.type) return "unknown";
  if (map.rating && (map.movieTitle || map.showTitle || map.genericTitle)) return "ratings";
  if (map.movieTitle) return "movies";
  if (map.showTitle) return "shows";
  if (map.genericTitle) return "movies";
  return "unknown";
}

export interface NormalizedRow {
  title?: string;
  episodeTitle?: string;
  season?: number;
  episodeNumber?: number;
  watchedAt?: Date;
  watched?: boolean;
  rating?: number;
  favorite?: boolean;
  status?: string;
  type?: "show" | "movie" | "episode" | undefined;
  imdbId?: string;
  tmdbId?: string;
  tvdbId?: string;
  listName?: string;
  extra: Record<string, string>;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseBool(value?: string): boolean | undefined {
  if (value === undefined || value === "") return undefined;
  return ["1", "true", "yes", "y", "watched"].includes(value.trim().toLowerCase());
}

export function normalizeRow(row: Record<string, string>, map: Partial<Record<LogicalField, string>>): NormalizedRow {
  const get = (field: LogicalField) => (map[field] ? row[map[field]!]?.trim() : undefined);
  const mappedColumns = new Set(Object.values(map));
  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!mappedColumns.has(k) && v) extra[k] = v;
  }

  const typeRaw = get("type")?.toLowerCase();
  const explicitType: "movie" | "episode" | undefined =
    typeRaw === "movie" ? "movie" : typeRaw === "episode" || typeRaw === "show" || typeRaw === "tv" ? "episode" : undefined;

  const showTitle = get("showTitle");
  const movieTitle = get("movieTitle");
  const seasonNum = get("season") ? Number(get("season")) : undefined;
  const episodeNum = get("episodeNumber") ? Number(get("episodeNumber")) : undefined;

  // Per-row resolution: whichever of show/movie title is actually populated
  // on THIS row wins, independent of what the file as a whole looks like.
  let title: string | undefined;
  let type: "show" | "movie" | "episode" | undefined = explicitType;
  if (showTitle) {
    title = showTitle;
    if (!type) type = seasonNum != null || episodeNum != null ? "episode" : "show";
  } else if (movieTitle) {
    title = movieTitle;
    if (!type) type = "movie";
  } else {
    title = get("genericTitle") || undefined;
  }

  return {
    title,
    episodeTitle: get("episodeTitle") || undefined,
    season: seasonNum,
    episodeNumber: episodeNum,
    watchedAt: parseDate(get("watchedAt")),
    watched: parseBool(get("watched")),
    rating: get("rating") ? Number(get("rating")) : undefined,
    favorite: parseBool(get("favorite")),
    status: get("status"),
    type,
    imdbId: get("imdbId") || undefined,
    tmdbId: get("tmdbId") || undefined,
    tvdbId: get("tvdbId") || undefined,
    listName: get("listName") || undefined,
    extra,
  };
}
