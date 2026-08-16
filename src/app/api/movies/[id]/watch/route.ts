import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { markMovieWatched, unmarkMovieWatched } from "@/lib/tracking";
import { handleApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const watchedAt = body.watchedAt ? new Date(body.watchedAt) : new Date();
    const watch = await markMovieWatched(user.id, params.id, watchedAt);
    return NextResponse.json(watch);
  } catch (err) {
    return handleApiError(err, "Could not mark movie as watched.");
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await unmarkMovieWatched(user.id, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not unmark movie.");
  }
}
