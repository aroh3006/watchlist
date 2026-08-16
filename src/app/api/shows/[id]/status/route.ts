import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { setShowStatus } from "@/lib/tracking";
import { WATCH_STATUSES } from "@/lib/constants";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { status } = await req.json();
    if (!WATCH_STATUSES.includes(status)) throw new ApiError("Invalid status");
    const result = await setShowStatus(user.id, params.id, status);
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, "Could not update show status.");
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await prisma.userShow.deleteMany({ where: { userId: user.id, showId: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not remove show.");
  }
}
