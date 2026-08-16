import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/apiError";
import { IMPORT_ROW_STATUSES, type ImportRowStatus } from "@/lib/constants";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const job = await prisma.importJob.findUnique({ where: { id: params.id } });
    if (!job || job.userId !== user.id) throw new ApiError("Import job not found", 404);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ImportRowStatus | null;
    const where = status && IMPORT_ROW_STATUSES.includes(status) ? { importJobId: params.id, status } : { importJobId: params.id };

    const rows = await prisma.importRow.findMany({ where, orderBy: { rowNumber: "asc" }, take: 500 });
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        rawData: JSON.parse(r.rawData),
        candidates: r.candidates ? JSON.parse(r.candidates) : null,
      }))
    );
  } catch (err) {
    return handleApiError(err, "Could not load import rows.");
  }
}
