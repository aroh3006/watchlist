import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { stageImportSource } from "@/lib/import/pipeline";
import { handleApiError, ApiError } from "@/lib/apiError";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = Number(process.env.IMPORT_MAX_UPLOAD_BYTES ?? 52428800);

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new ApiError("No file uploaded");

    if (file.size > MAX_BYTES) {
      throw new ApiError(`File is too large. Maximum upload size is ${Math.round(MAX_BYTES / 1024 / 1024)}MB.`);
    }

    const name = file.name.toLowerCase();
    const sourceKind = name.endsWith(".zip") ? "zip" : name.endsWith(".csv") ? "csv" : null;
    if (!sourceKind) throw new ApiError("Only .zip and .csv files are supported.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const jobId = await stageImportSource(user.id, file.name, sourceKind, buffer);
    const job = await prisma.importJob.findUniqueOrThrow({ where: { id: jobId } });

    return NextResponse.json(job);
  } catch (err) {
    return handleApiError(err, "Import failed.");
  }
}
