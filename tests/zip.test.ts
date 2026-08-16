import { describe, it, expect } from "vitest";
import { extractCsvFilesFromZip } from "@/lib/import/zip";
import { buildZip } from "@/lib/export/zipWriter";

describe("extractCsvFilesFromZip", () => {
  it("extracts well-formed CSV entries", async () => {
    const zip = buildZip([{ name: "watched.csv", content: "title\nGlass Horizon\n" }]);
    const { files, skipped } = await extractCsvFilesFromZip(zip);
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("watched.csv");
    expect(files[0].buffer.toString("utf-8")).toContain("Glass Horizon");
    expect(skipped).toHaveLength(0);
  });

  it("rejects path traversal entries (zip-slip) instead of extracting them", async () => {
    const zip = buildZip([
      { name: "../../etc/evil.csv", content: "malicious" },
      { name: "safe.csv", content: "title\nOK\n" },
    ]);
    const { files, skipped } = await extractCsvFilesFromZip(zip);
    expect(files.map((f) => f.filename)).toEqual(["safe.csv"]);
    expect(skipped.some((s) => s.filename.includes(".."))).toBe(true);
  });

  it("skips non-CSV files rather than importing them", async () => {
    const zip = buildZip([
      { name: "readme.txt", content: "hello" },
      { name: "data.csv", content: "title\nOK\n" },
    ]);
    const { files, skipped } = await extractCsvFilesFromZip(zip);
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("data.csv");
    expect(skipped.some((s) => s.filename === "readme.txt")).toBe(true);
  });
});
