import Papa from "papaparse";

const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Neutralizes spreadsheet formula injection: a cell value like `=cmd|...`
 * or `@SUM(...)` gets interpreted as a formula by Excel/Sheets when the
 * CSV is opened. Prefixing with a single quote forces it to render as
 * literal text while staying valid CSV.
 */
export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (DANGEROUS_PREFIXES.some((p) => str.startsWith(p))) {
    return `'${str}`;
  }
  return str;
}

export function toSafeCsv<T extends Record<string, unknown>>(rows: T[]): string {
  const sanitized = rows.map((row) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) out[k] = sanitizeCsvValue(v);
    return out;
  });
  return Papa.unparse(sanitized);
}
