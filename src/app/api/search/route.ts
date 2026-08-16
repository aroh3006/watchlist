import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { getMetadataProvider } from "@/lib/metadata";
import { handleApiError } from "@/lib/apiError";

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() ?? "";
    if (!query) return NextResponse.json({ shows: [], movies: [] });

    const provider = getMetadataProvider();
    const [shows, movies] = await Promise.all([
      provider.searchShows({ query, limit: 10 }),
      provider.searchMovies({ query, limit: 10 }),
    ]);
    return NextResponse.json({ shows, movies });
  } catch (err) {
    return handleApiError(err, "Search failed.");
  }
}
