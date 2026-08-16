import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { commitImportJob } from "@/lib/import/pipeline";
import { handleApiError, ApiError } from "@/lib/apiError";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const job = await prisma.importJob.findUnique({ where: { id: params.id } });
    if (!job || job.userId !== user.id) throw new ApiError("Import job not found", 404);

    // Anything still unresolved at commit time is left as UNMATCHED/AMBIGUOUS
    // in the audit trail rather than silently dropped or guessed.
    await prisma.importRow.updateMany({
      where: { importJobId: params.id, status: "AMBIGUOUS" },
      data: { status: "UNMATCHED" },
    });

    await commitImportJob(params.id);
    const finished = await prisma.importJob.findUniqueOrThrow({ where: { id: params.id } });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "IMPORT_COMPLETE",
        title: "Import complete",
        body: `${finished.matchedRows} rows matched, ${finished.unmatchedRows} unmatched, ${finished.duplicateRows} duplicates skipped.`,
      },
    });

    return NextResponse.json(finished);
  } catch (err) {
    return handleApiError(err, "Could not finish import.");
  }
}
