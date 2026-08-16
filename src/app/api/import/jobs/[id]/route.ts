import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const job = await prisma.importJob.findUnique({ where: { id: params.id }, include: { files: true } });
    if (!job || job.userId !== user.id) throw new ApiError("Import job not found", 404);
    return NextResponse.json(job);
  } catch (err) {
    return handleApiError(err, "Could not load import job.");
  }
}
