import { requireUser } from "@/lib/session";
import { gatherUserExport } from "@/lib/export";
import { toSafeCsv } from "@/lib/export/csv";
import { buildZip } from "@/lib/export/zipWriter";
import { handleApiError } from "@/lib/apiError";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await gatherUserExport(user.id);

    const zip = buildZip([
      { name: "profile.csv", content: toSafeCsv([data.profile]) },
      { name: "shows.csv", content: toSafeCsv(data.shows) },
      { name: "movies.csv", content: toSafeCsv(data.movies) },
      { name: "episode_watches.csv", content: toSafeCsv(data.episodeWatches) },
      { name: "movie_watches.csv", content: toSafeCsv(data.movieWatches) },
      { name: "ratings.csv", content: toSafeCsv(data.ratings) },
      { name: "favorites.csv", content: toSafeCsv(data.favorites) },
      { name: "lists.csv", content: toSafeCsv(data.lists) },
      { name: "list_items.csv", content: toSafeCsv(data.listItems) },
      { name: "badges.csv", content: toSafeCsv(data.badges) },
    ]);

    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="watchlist-export-${user.id}.zip"`,
      },
    });
  } catch (err) {
    return handleApiError(err, "Export failed.");
  }
}
