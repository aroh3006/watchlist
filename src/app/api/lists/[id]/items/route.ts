import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const list = await prisma.customList.findUnique({ where: { id: params.id } });
    if (!list || list.userId !== user.id) throw new ApiError("List not found", 404);

    const { showId, movieId } = await req.json();
    if (!showId && !movieId) throw new ApiError("showId or movieId is required");

    const filter = { listId: params.id, showId: showId ?? null, movieId: movieId ?? null };
    const existing = await prisma.customListItem.findFirst({ where: filter });
    if (existing) return NextResponse.json(existing);

    const count = await prisma.customListItem.count({ where: { listId: params.id } });
    const item = await prisma.customListItem.create({ data: { ...filter, position: count } });
    return NextResponse.json(item);
  } catch (err) {
    return handleApiError(err, "Could not add item to list.");
  }
}
