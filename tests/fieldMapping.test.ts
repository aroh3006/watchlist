import { describe, it, expect } from "vitest";
import { buildFieldMap, detectFileKind, normalizeRow } from "@/lib/import/fieldMapping";

describe("buildFieldMap", () => {
  it("recognizes common column name synonyms", () => {
    const map = buildFieldMap(["Show", "Season Number", "Episode Number", "Watch Date", "IMDb ID"]);
    expect(map.showTitle).toBe("Show");
    expect(map.season).toBe("Season Number");
    expect(map.episodeNumber).toBe("Episode Number");
    expect(map.watchedAt).toBe("Watch Date");
    expect(map.imdbId).toBe("IMDb ID");
  });

  it("leaves unmapped fields undefined instead of guessing", () => {
    const map = buildFieldMap(["completely_unrelated_column"]);
    expect(map.showTitle).toBeUndefined();
    expect(map.movieTitle).toBeUndefined();
  });

  it("does not treat a generic 'name' column as a title", () => {
    // Real-world exports often have unrelated {id, name, value} settings
    // tables — a bare "name" column must never be searched as a title.
    const map = buildFieldMap(["id", "name", "value", "user_id"]);
    expect(map.showTitle).toBeUndefined();
    expect(map.movieTitle).toBeUndefined();
    expect(map.genericTitle).toBeUndefined();
  });
});

describe("detectFileKind", () => {
  it("classifies an episode-shaped file", () => {
    expect(detectFileKind(["show", "season", "episode_number", "watched_at"])).toBe("episodes");
  });

  it("classifies a movie-shaped file", () => {
    expect(detectFileKind(["movie", "watched_at"])).toBe("movies");
  });

  it("classifies a ratings file", () => {
    expect(detectFileKind(["title", "rating"])).toBe("ratings");
  });

  it("classifies a file with both movie and show title columns as mixed/unknown", () => {
    // Real TV Time export tables denormalize movie_name AND series_name onto
    // every row, populating only one per row — file-level classification
    // can't know which applies row-by-row, so routing defers to normalizeRow.
    expect(detectFileKind(["movie_name", "series_name", "season_number", "episode_number"])).toBe("unknown");
  });
});

describe("normalizeRow", () => {
  it("parses dates, booleans, and numbers from mapped columns", () => {
    const headers = ["Show", "Season", "Episode", "Watch Date", "Rating", "Favorite"];
    const map = buildFieldMap(headers);
    const row = normalizeRow(
      { Show: "Glass Horizon", Season: "2", Episode: "5", "Watch Date": "2024-03-01", Rating: "9", Favorite: "yes" },
      map
    );
    expect(row.title).toBe("Glass Horizon");
    expect(row.season).toBe(2);
    expect(row.episodeNumber).toBe(5);
    expect(row.watchedAt?.toISOString().slice(0, 10)).toBe("2024-03-01");
    expect(row.rating).toBe(9);
    expect(row.favorite).toBe(true);
  });

  it("preserves unmapped columns instead of discarding them", () => {
    const headers = ["title", "custom_tag"];
    const map = buildFieldMap(headers);
    const row = normalizeRow({ title: "Glass Horizon", custom_tag: "must-keep" }, map);
    expect(row.extra.custom_tag).toBe("must-keep");
  });

  it("picks the movie title when movie_name is populated and series_name is blank", () => {
    const headers = ["movie_name", "series_name", "season_number", "episode_number"];
    const map = buildFieldMap(headers);
    const row = normalizeRow({ movie_name: "The Housemaid", series_name: "", season_number: "", episode_number: "" }, map);
    expect(row.title).toBe("The Housemaid");
    expect(row.type).toBe("movie");
  });

  it("picks the show title when series_name is populated and movie_name is blank, on the same file", () => {
    const headers = ["movie_name", "series_name", "season_number", "episode_number"];
    const map = buildFieldMap(headers);
    const row = normalizeRow(
      { movie_name: "", series_name: "Glass Horizon", season_number: "2", episode_number: "5" },
      map
    );
    expect(row.title).toBe("Glass Horizon");
    expect(row.type).toBe("episode");
  });

  it("never falls back to a generic 'name' column even if present in raw data", () => {
    const headers = ["id", "name", "value"];
    const map = buildFieldMap(headers);
    const row = normalizeRow({ id: "1", name: "is_organic", value: "1" }, map);
    expect(row.title).toBeUndefined();
  });
});
