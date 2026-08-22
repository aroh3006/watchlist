import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { setMovieStatus } from "@/lib/tracking";
import { WATCH_STATUSES } from "@/lib/constants";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { status } = await req.json();
    if (!WATCH_STATUSES.includes(status)) throw new ApiError("Invalid status");
    const result = await setMovieStatus(user.id, params.id, status);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, "Could not update movie status.");
  }
}

// Removing a movie this way means "not watched, never happened", so its
// UserMovie, Rating, and Favorite rows are all cleared together, the movie
// goes back to looking exactly like one the user never touched. MovieWatch
// and DailyWatchActivity are deliberately left alone: they record real
// watch events, and clearing tracking status later should never erase
// history that already happened.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await prisma.$transaction([
      prisma.userMovie.deleteMany({ where: { userId: user.id, movieId: params.id } }),
      prisma.rating.deleteMany({ where: { userId: user.id, targetType: "MOVIE", movieId: params.id } }),
      prisma.favorite.deleteMany({ where: { userId: user.id, targetType: "MOVIE", movieId: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not remove movie.");
  }
}
