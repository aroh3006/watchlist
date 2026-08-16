import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("No file provided");
    if (!file.type.startsWith("image/")) throw new ApiError("File must be an image");
    if (file.size > MAX_BYTES) throw new ApiError("Image must be under 3MB");

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

    await prisma.profile.update({ where: { userId: user.id }, data: { avatarUrl: dataUrl } });
    return NextResponse.json({ avatarUrl: dataUrl });
  } catch (err) {
    return handleApiError(err, "Could not upload photo.");
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await prisma.profile.update({ where: { userId: user.id }, data: { avatarUrl: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "Could not remove photo.");
  }
}
