import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

async function assertOwnership(userId: string, listId: string) {
  const list = await prisma.customList.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) throw new ApiError("List not found", 404);
  return list;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnership(user.id, params.id);
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.description === "string") data.description = body.description.trim();
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    const updated = await prisma.customList.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err, "Could not update list.");
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await assertOwnership(user.id, params.id);
    await prisma.customList.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not delete list.");
  }
}
