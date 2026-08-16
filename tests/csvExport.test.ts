import { describe, it, expect } from "vitest";
import { sanitizeCsvValue, toSafeCsv } from "@/lib/export/csv";

describe("sanitizeCsvValue", () => {
  it("neutralizes formula-injection prefixes", () => {
    expect(sanitizeCsvValue("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1");
    expect(sanitizeCsvValue("+1+1")).toBe("'+1+1");
    expect(sanitizeCsvValue("-1+1")).toBe("'-1+1");
    expect(sanitizeCsvValue("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("leaves ordinary values untouched", () => {
    expect(sanitizeCsvValue("Glass Horizon")).toBe("Glass Horizon");
    expect(sanitizeCsvValue(9)).toBe("9");
  });

  it("handles null/undefined safely", () => {
    expect(sanitizeCsvValue(null)).toBe("");
    expect(sanitizeCsvValue(undefined)).toBe("");
  });
});

describe("toSafeCsv", () => {
  it("produces a CSV where no cell can execute as a formula", () => {
    const csv = toSafeCsv([{ title: "=HYPERLINK(\"http://evil\")", rating: 9 }]);
    expect(csv).toContain("'=HYPERLINK");
  });
});
