import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { ensureShowSynced, ensureMovieSynced } from "@/lib/metadata/sync";
import { setShowStatus, setMovieStatus } from "@/lib/tracking";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { type, provider, externalId, status } = await req.json();
    if (type !== "show" && type !== "movie") throw new ApiError("type must be show or movie");

    if (type === "show") {
      const showId = await ensureShowSynced(provider ?? "local", externalId);
      const result = await setShowStatus(user.id, showId, status ?? "PLANNED");
      return NextResponse.json({ id: showId, userShow: result });
    } else {
      const movieId = await ensureMovieSynced(provider ?? "local", externalId);
      const result = await setMovieStatus(user.id, movieId, status ?? "PLANNED");
      return NextResponse.json({ id: movieId, userMovie: result });
    }
  } catch (err) {
    return handleApiError(err, "Could not add to your library.");
  }
}
