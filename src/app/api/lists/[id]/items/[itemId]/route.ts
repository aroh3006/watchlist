import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  try {
    const user = await requireUser();
    const list = await prisma.customList.findUnique({ where: { id: params.id } });
    if (!list || list.userId !== user.id) throw new ApiError("List not found", 404);
    await prisma.customListItem.deleteMany({ where: { id: params.itemId, listId: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not remove item.");
  }
}
