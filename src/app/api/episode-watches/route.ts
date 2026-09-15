import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { updateEpisodeWatchesDate } from "@/lib/tracking";
import { handleApiError, ApiError } from "@/lib/apiError";

// Corrects the date on watch rows the caller just created (see
// WatchDateEditor), not a general "edit any watch history" endpoint. The ids
// come from a mark-watched response, and the update is scoped to the
// requesting user regardless.
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const { ids, watchedAt } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
      throw new ApiError("ids must be a non-empty array of strings");
    }
    if (!watchedAt) throw new ApiError("watchedAt is required");
    await updateEpisodeWatchesDate(user.id, ids, new Date(watchedAt));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not update the watched date.");
  }
}
