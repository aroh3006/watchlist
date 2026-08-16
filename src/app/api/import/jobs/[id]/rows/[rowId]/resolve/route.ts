import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { resolveAmbiguousRow } from "@/lib/import/pipeline";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(req: Request, { params }: { params: { id: string; rowId: string } }) {
  try {
    const user = await requireUser();
    const job = await prisma.importJob.findUnique({ where: { id: params.id } });
    if (!job || job.userId !== user.id) throw new ApiError("Import job not found", 404);

    const { entityId, skip, applyToSimilar } = await req.json();
    const row = await prisma.importRow.findUniqueOrThrow({ where: { id: params.rowId } });

    await resolveAmbiguousRow(params.rowId, { entityId, skip });

    if (applyToSimilar && entityId) {
      const rawData = JSON.parse(row.rawData) as Record<string, string>;
      const similar = await prisma.importRow.findMany({
        where: { importJobId: params.id, status: "AMBIGUOUS", id: { not: row.id } },
      });
      for (const s of similar) {
        const sRaw = JSON.parse(s.rawData) as Record<string, string>;
        // Conservative: only bulk-apply to rows whose raw title fields match exactly.
        const titleKeys = Object.keys(rawData).filter((k) => /title|show|series|movie|name/i.test(k));
        const matches = titleKeys.length > 0 && titleKeys.every((k) => sRaw[k] === rawData[k]);
        if (matches) {
          await resolveAmbiguousRow(s.id, { entityId });
        }
      }
    }

    const remaining = await prisma.importRow.count({ where: { importJobId: params.id, status: "AMBIGUOUS" } });
    if (remaining === 0) {
      await prisma.importJob.update({ where: { id: params.id }, data: { status: "MATCHING", stage: "Ready to import" } });
    }

    return NextResponse.json({ ok: true, remaining });
  } catch (err) {
    return handleApiError(err, "Could not resolve row.");
  }
}
