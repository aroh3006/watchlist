import { requireUser } from "@/lib/session";
import { gatherUserExport } from "@/lib/export";
import { toSafeCsv } from "@/lib/export/csv";
import { handleApiError } from "@/lib/apiError";

/** Single-file CSV export of combined watch history (episodes + movies), the most common ask. */
export async function GET() {
  try {
    const user = await requireUser();
    const data = await gatherUserExport(user.id);

    const combined = [
      ...data.episodeWatches.map((w) => ({
        type: "episode",
        title: w.show,
        season: w.season,
        episode: w.episode,
        episodeTitle: w.episodeTitle,
        watchedAt: w.watchedAt,
        source: w.source,
      })),
      ...data.movieWatches.map((w) => ({
        type: "movie",
        title: w.movie,
        season: "",
        episode: "",
        episodeTitle: "",
        watchedAt: w.watchedAt,
        source: w.source,
      })),
    ].sort((a, b) => a.watchedAt.localeCompare(b.watchedAt));

    const csv = toSafeCsv(combined);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="watchlist-history-${user.id}.csv"`,
      },
    });
  } catch (err) {
    return handleApiError(err, "Export failed.");
  }
}
