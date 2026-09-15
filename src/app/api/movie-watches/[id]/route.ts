import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { updateMovieWatchDate } from "@/lib/tracking";
import { handleApiError, ApiError } from "@/lib/apiError";

// Corrects the date on a watch row the caller just created (see
// WatchDateEditor), not a general "edit any watch history" endpoint. The
// update is scoped to the requesting user regardless.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { watchedAt } = await req.json();
    if (!watchedAt) throw new ApiError("watchedAt is required");
    await updateMovieWatchDate(user.id, params.id, new Date(watchedAt));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not update the watched date.");
  }
}
