import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { rate, clearRating } from "@/lib/tracking";
import { RATING_TARGET_TYPES } from "@/lib/constants";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { targetType, id, score } = await req.json();
    if (!RATING_TARGET_TYPES.includes(targetType) || targetType === "SEASON") throw new ApiError("Invalid target type");
    const result = await rate(user.id, targetType, id, Number(score));
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, "Could not save rating.");
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { targetType, id } = await req.json();
    if (!RATING_TARGET_TYPES.includes(targetType) || targetType === "SEASON") throw new ApiError("Invalid target type");
    await clearRating(user.id, targetType, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not clear rating.");
  }
}
