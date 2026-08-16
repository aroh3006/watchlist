import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { REACTION_TYPES } from "@/lib/constants";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { episodeId, movieId, type } = await req.json();
    if (!REACTION_TYPES.includes(type)) throw new ApiError("Invalid reaction type");
    if (!episodeId && !movieId) throw new ApiError("episodeId or movieId is required");

    const existing = await prisma.reaction.findFirst({
      where: { userId: user.id, episodeId: episodeId ?? null, movieId: movieId ?? null },
    });
    if (existing) {
      const updated = await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
      return NextResponse.json(updated);
    }
    const created = await prisma.reaction.create({
      data: { userId: user.id, episodeId: episodeId ?? null, movieId: movieId ?? null, type },
    });
    return NextResponse.json(created);
  } catch (err) {
    return handleApiError(err, "Could not save reaction.");
  }
}
