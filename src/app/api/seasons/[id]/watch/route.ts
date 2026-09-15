import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { markSeasonWatched } from "@/lib/tracking";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const watchedAt = body.watchedAt ? new Date(body.watchedAt) : new Date();
    const created = await markSeasonWatched(user.id, params.id, watchedAt);
    return NextResponse.json({
      watches: created.map((w) => ({ id: w.id, episodeId: w.episodeId })),
    });
  } catch (err) {
    return handleApiError(err, "Could not mark season as watched.");
  }
}
