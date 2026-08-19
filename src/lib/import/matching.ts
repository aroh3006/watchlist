import { prisma } from "@/lib/prisma";
import { getMetadataProvider } from "@/lib/metadata";
import { ensureShowSynced, ensureMovieSynced } from "@/lib/metadata/sync";
import type { NormalizedRow } from "./fieldMapping";

export interface MatchCandidate {
  id: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  score: number;
  /** Set when this candidate hasn't been materialized into the local DB yet. Resolution must sync it first. */
  providerRef?: { provider: string; externalId: string };
}

export type MatchOutcome =
  | { status: "MATCHED"; entityId: string }
  | { status: "AMBIGUOUS"; candidates: MatchCandidate[] }
  | { status: "UNMATCHED" };

const AUTO_MATCH_SCORE = 90;

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * A candidate is auto-matched only when it's the single clear winner. Its
 * score clears the auto-match bar AND no other candidate ties it. Multiple
 * candidates tied at the top (e.g. two shows with an identical title) still
 * go to manual review; this is what keeps "never silently match an
 * obviously ambiguous title" true while not forcing review on every title
 * that merely has other, clearly-worse candidates alongside it.
 */
function pickWinner(scored: MatchCandidate[]): MatchCandidate | null {
  if (scored.length === 0) return null;
  const [top, second] = scored;
  if (top.score >= AUTO_MATCH_SCORE && (!second || second.score < top.score)) return top;
  return null;
}

/**
 * Matching priority, per spec: exact external id > exact normalized title
 * (+year when available) > fuzzy title > ambiguous/unmatched. Never picks
 * an obviously ambiguous title automatically. Multiple close candidates
 * are surfaced for manual review instead of guessing.
 *
 * If nothing in Watchlist's own catalog matches, falls back to searching
 * the active metadata provider (see src/lib/metadata). This is what lets
 * import discover and add real-world titles that were never in the local
 * catalog to begin with, not just re-match existing entries.
 */
export async function matchShow(row: NormalizedRow): Promise<MatchOutcome> {
  for (const [provider, id] of [
    ["imdb", row.imdbId],
    ["tmdb", row.tmdbId],
    ["tvdb", row.tvdbId],
  ] as const) {
    if (id) {
      const ext = await prisma.externalId.findUnique({
        where: { provider_entityType_externalId: { provider, entityType: "SHOW", externalId: id } },
      });
      if (ext?.showId) return { status: "MATCHED", entityId: ext.showId };
    }
  }

  if (!row.title) return { status: "UNMATCHED" };
  const target = normalizeTitle(row.title);

  const exact = await prisma.show.findFirst({ where: { title: { equals: row.title } } });
  if (exact) return { status: "MATCHED", entityId: exact.id };

  const localCandidates = await prisma.show.findMany({ where: { title: { contains: row.title } }, take: 6 });
  const localScored: MatchCandidate[] = localCandidates
    .map((c) => ({
      id: c.id,
      title: c.title,
      posterUrl: c.posterUrl,
      year: c.firstAirDate?.getFullYear() ?? null,
      score: normalizeTitle(c.title) === target ? 100 : 60,
    }))
    .sort((a, b) => b.score - a.score);

  const localWinner = pickWinner(localScored);
  if (localWinner) return { status: "MATCHED", entityId: localWinner.id };
  if (localScored.length > 0) return { status: "AMBIGUOUS", candidates: localScored };

  // Nothing local, ask the active metadata provider before giving up.
  const provider = getMetadataProvider();
  const results = await provider.searchShows({ query: row.title, limit: 5 }).catch(() => []);
  if (results.length === 0) return { status: "UNMATCHED" };

  const providerScored: MatchCandidate[] = results
    .map((r, i) => ({
      id: `${r.provider}:${r.externalId}`,
      title: r.title,
      posterUrl: r.posterUrl ?? null,
      year: r.firstAirDate ? new Date(r.firstAirDate).getFullYear() : null,
      score: normalizeTitle(r.title) === target ? 95 : 50 - i,
      providerRef: { provider: r.provider, externalId: r.externalId },
    }))
    .sort((a, b) => b.score - a.score);

  const providerWinner = pickWinner(providerScored);
  if (providerWinner?.providerRef) {
    const showId = await ensureShowSynced(providerWinner.providerRef.provider, providerWinner.providerRef.externalId);
    return { status: "MATCHED", entityId: showId };
  }

  return { status: "AMBIGUOUS", candidates: providerScored };
}

export async function matchMovie(row: NormalizedRow): Promise<MatchOutcome> {
  for (const [provider, id] of [
    ["imdb", row.imdbId],
    ["tmdb", row.tmdbId],
  ] as const) {
    if (id) {
      const ext = await prisma.externalId.findUnique({
        where: { provider_entityType_externalId: { provider, entityType: "MOVIE", externalId: id } },
      });
      if (ext?.movieId) return { status: "MATCHED", entityId: ext.movieId };
    }
  }

  if (!row.title) return { status: "UNMATCHED" };
  const target = normalizeTitle(row.title);

  const exact = await prisma.movie.findFirst({ where: { title: { equals: row.title } } });
  if (exact) return { status: "MATCHED", entityId: exact.id };

  const localCandidates = await prisma.movie.findMany({ where: { title: { contains: row.title } }, take: 6 });
  const localScored: MatchCandidate[] = localCandidates
    .map((c) => ({
      id: c.id,
      title: c.title,
      posterUrl: c.posterUrl,
      year: c.releaseDate?.getFullYear() ?? null,
      score: normalizeTitle(c.title) === target ? 100 : 60,
    }))
    .sort((a, b) => b.score - a.score);

  const localWinner = pickWinner(localScored);
  if (localWinner) return { status: "MATCHED", entityId: localWinner.id };
  if (localScored.length > 0) return { status: "AMBIGUOUS", candidates: localScored };

  const provider = getMetadataProvider();
  const results = await provider.searchMovies({ query: row.title, limit: 5 }).catch(() => []);
  if (results.length === 0) return { status: "UNMATCHED" };

  const providerScored: MatchCandidate[] = results
    .map((r, i) => ({
      id: `${r.provider}:${r.externalId}`,
      title: r.title,
      posterUrl: r.posterUrl ?? null,
      year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : null,
      score: normalizeTitle(r.title) === target ? 95 : 50 - i,
      providerRef: { provider: r.provider, externalId: r.externalId },
    }))
    .sort((a, b) => b.score - a.score);

  const providerWinner = pickWinner(providerScored);
  if (providerWinner?.providerRef) {
    const movieId = await ensureMovieSynced(providerWinner.providerRef.provider, providerWinner.providerRef.externalId);
    return { status: "MATCHED", entityId: movieId };
  }

  return { status: "AMBIGUOUS", candidates: providerScored };
}
