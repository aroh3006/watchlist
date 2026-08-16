import type { MetadataProvider } from "./types";
import { LocalDatasetProvider } from "./localProvider";
import { TmdbProvider } from "./tmdbProvider";

export * from "./types";

let cached: MetadataProvider | null = null;

/**
 * Single point of provider selection, driven by METADATA_PROVIDER. Nothing
 * outside this module should decide which provider to use — that keeps a
 * future provider swap (or a licensed local dataset drop-in) to a one-line
 * env var change instead of an application rewrite.
 */
export function getMetadataProvider(): MetadataProvider {
  if (cached) return cached;

  const kind = process.env.METADATA_PROVIDER ?? "local";
  if (kind === "tmdb" && process.env.METADATA_TMDB_API_KEY) {
    cached = new TmdbProvider(process.env.METADATA_TMDB_API_KEY);
  } else {
    cached = new LocalDatasetProvider();
  }
  return cached;
}
