import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function GET() {
  try {
    const user = await requireUser();
    const lists = await prisma.customList.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json(lists);
  } catch (err) {
    return handleApiError(err, "Could not load lists.");
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { name, description, isPublic } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) throw new ApiError("List name is required");
    const count = await prisma.customList.count({ where: { userId: user.id } });
    const list = await prisma.customList.create({
      data: { userId: user.id, name: name.trim(), description: description?.trim() || null, isPublic: !!isPublic, sortOrder: count },
    });
    return NextResponse.json(list);
  } catch (err) {
    return handleApiError(err, "Could not create list.");
  }
}
