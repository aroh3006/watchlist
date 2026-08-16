import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { recomputeDailyActivityForUser } from "@/lib/stats/activity";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { timezone } = await req.json();
    if (typeof timezone !== "string" || !timezone) throw new ApiError("Invalid timezone");
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      throw new ApiError("Unrecognized timezone");
    }
    await prisma.profile.update({ where: { userId: user.id }, data: { timezone } });
    // Daily activity buckets are timezone-dependent, so recompute after a change.
    await recomputeDailyActivityForUser(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not update timezone.");
  }
}
