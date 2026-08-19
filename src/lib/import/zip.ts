import unzipper from "unzipper";

export interface ExtractedFile {
  filename: string;
  buffer: Buffer;
}

export interface ZipExtractionResult {
  files: ExtractedFile[];
  skipped: { filename: string; reason: string }[];
}

const MAX_ENTRY_BYTES = 25 * 1024 * 1024; // 25MB per file, generous for CSV exports
const MAX_TOTAL_ENTRIES = 500;

/**
 * Safely extracts CSV files from a ZIP buffer entirely in memory (no files
 * ever touch disk, so there is nothing for a zip-slip path to escape into).
 * Rejects/records anything that isn't a plain, safely-named .csv entry.
 * Path traversal (`../`), absolute paths, and non-CSV content are all
 * skipped rather than extracted.
 */
export async function extractCsvFilesFromZip(buffer: Buffer): Promise<ZipExtractionResult> {
  const directory = await unzipper.Open.buffer(buffer);
  const files: ExtractedFile[] = [];
  const skipped: { filename: string; reason: string }[] = [];

  if (directory.files.length > MAX_TOTAL_ENTRIES) {
    throw new Error(`ZIP contains too many entries (${directory.files.length}); limit is ${MAX_TOTAL_ENTRIES}.`);
  }

  for (const entry of directory.files) {
    const rawPath = entry.path;

    if (entry.type !== "File") continue;

    // Reject anything that isn't a clean relative path: no traversal, no
    // absolute paths, no backslashes (Windows-style traversal), no null bytes.
    const isSafe =
      !rawPath.includes("..") &&
      !rawPath.startsWith("/") &&
      !rawPath.startsWith("\\") &&
      !/^[a-zA-Z]:/.test(rawPath) &&
      !rawPath.includes("\0");

    if (!isSafe) {
      skipped.push({ filename: rawPath, reason: "Unsafe path rejected" });
      continue;
    }

    const filename = rawPath.split("/").pop() ?? rawPath;
    if (!filename.toLowerCase().endsWith(".csv")) {
      skipped.push({ filename, reason: "Not a CSV file" });
      continue;
    }

    if (entry.uncompressedSize > MAX_ENTRY_BYTES) {
      skipped.push({ filename, reason: "File too large" });
      continue;
    }

    const content = await entry.buffer();
    files.push({ filename, buffer: content });
  }

  return { files, skipped };
}
