import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/import/csv";

describe("parseCsv", () => {
  it("parses standard comma-separated rows with headers", () => {
    const buf = Buffer.from("title,rating\nGlass Horizon,9\nBrackenfield,8\n", "utf-8");
    const { headers, rows } = parseCsv(buf);
    expect(headers).toEqual(["title", "rating"]);
    expect(rows).toEqual([
      { title: "Glass Horizon", rating: "9" },
      { title: "Brackenfield", rating: "8" },
    ]);
  });

  it("strips a leading UTF-8 BOM", () => {
    const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("title\nGlass Horizon\n", "utf-8")]);
    const { headers, rows } = parseCsv(buf);
    expect(headers).toEqual(["title"]);
    expect(rows[0].title).toBe("Glass Horizon");
  });

  it("handles quoted values containing commas", () => {
    const buf = Buffer.from('title,note\n"Glass Horizon, Season 1","Great, really great"\n', "utf-8");
    const { rows } = parseCsv(buf);
    expect(rows[0].title).toBe("Glass Horizon, Season 1");
    expect(rows[0].note).toBe("Great, really great");
  });

  it("handles CRLF line endings", () => {
    const buf = Buffer.from("title,rating\r\nGlass Horizon,9\r\nBrackenfield,8\r\n", "utf-8");
    const { rows } = parseCsv(buf);
    expect(rows).toHaveLength(2);
    expect(rows[1].title).toBe("Brackenfield");
  });

  it("tolerates missing and unknown columns without throwing", () => {
    const buf = Buffer.from("title,mystery_column\nGlass Horizon,whatever\n", "utf-8");
    const { rows } = parseCsv(buf);
    expect(rows[0]).toEqual({ title: "Glass Horizon", mystery_column: "whatever" });
  });

  it("skips fully empty lines", () => {
    const buf = Buffer.from("title\nGlass Horizon\n\n\nBrackenfield\n", "utf-8");
    const { rows } = parseCsv(buf);
    expect(rows.map((r) => r.title)).toEqual(["Glass Horizon", "Brackenfield"]);
  });
});
