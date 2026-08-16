import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

/**
 * Parses CSV text into rows, tolerating BOM, CRLF/LF/CR line endings,
 * quoted values containing commas, and missing/unknown columns. Never
 * throws on malformed individual rows — collects parse errors instead so a
 * few bad lines don't sink the whole file.
 */
export function parseCsv(buffer: Buffer): ParsedCsv {
  // Strip a UTF-8 BOM if present; papaparse otherwise treats it as part of the first header.
  let text = buffer.toString("utf-8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  const errors = result.errors.map((e) => `Row ${e.row ?? "?"}: ${e.message}`);
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data, errors };
}
