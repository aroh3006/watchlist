import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { toggleFavorite } from "@/lib/tracking";
import { FAVORITE_TARGET_TYPES } from "@/lib/constants";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { targetType, id } = await req.json();
    if (!FAVORITE_TARGET_TYPES.includes(targetType)) throw new ApiError("Invalid target type");
    const result = await toggleFavorite(user.id, targetType, id);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, "Could not update favorite.");
  }
}
