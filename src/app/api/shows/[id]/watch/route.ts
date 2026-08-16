import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { markShowWatched } from "@/lib/tracking";
import { handleApiError } from "@/lib/apiError";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await markShowWatched(user.id, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not mark show as watched.");
  }
}
