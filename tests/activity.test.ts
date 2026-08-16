import { describe, it, expect } from "vitest";
import { activityScoreFor, computeStreaks } from "@/lib/stats/activity";
import { dateKeyInTimezone, addDaysToKey } from "@/lib/time";

describe("activityScoreFor", () => {
  it("returns 0 for no activity", () => {
    expect(activityScoreFor(0, 0)).toBe(0);
  });
  it("weighs movies more heavily than episodes", () => {
    expect(activityScoreFor(0, 1)).toBe(activityScoreFor(2, 0));
  });
  it("increases with more activity", () => {
    expect(activityScoreFor(1, 0)).toBeLessThan(activityScoreFor(10, 0));
  });
});

describe("computeStreaks", () => {
  it("counts a streak still active if the user watched yesterday but not yet today", () => {
    const today = "2024-06-10";
    const yesterday = "2024-06-09";
    const days = ["2024-06-07", "2024-06-08", yesterday];
    const result = computeStreaks(days, today, yesterday);
    expect(result.currentStreak).toBe(3);
  });

  it("resets current streak to 0 if the most recent activity is older than yesterday", () => {
    const today = "2024-06-10";
    const yesterday = "2024-06-09";
    const days = ["2024-06-01", "2024-06-02"];
    const result = computeStreaks(days, today, yesterday);
    expect(result.currentStreak).toBe(0);
  });

  it("finds the longest streak across the full history, not just the current one", () => {
    const today = "2024-06-20";
    const yesterday = "2024-06-19";
    const days = ["2024-06-01", "2024-06-02", "2024-06-03", "2024-06-04", "2024-06-10"];
    const result = computeStreaks(days, today, yesterday);
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(0);
  });

  it("counts total active days", () => {
    const result = computeStreaks(["2024-01-01", "2024-01-01", "2024-01-03"], "2024-06-01", "2024-05-31");
    expect(result.activeDays).toBe(2);
  });
});

describe("timezone-aware date keys", () => {
  it("assigns a late-night local watch to the correct local calendar day", () => {
    // 23:30 in America/Los_Angeles on 2024-06-10 is 2024-06-11 06:30 UTC.
    const instant = new Date("2024-06-11T06:30:00.000Z");
    expect(dateKeyInTimezone(instant, "America/Los_Angeles")).toBe("2024-06-10");
    expect(dateKeyInTimezone(instant, "UTC")).toBe("2024-06-11");
  });

  it("adds days across month/year boundaries correctly", () => {
    expect(addDaysToKey("2024-01-31", 1)).toBe("2024-02-01");
    expect(addDaysToKey("2024-12-31", 1)).toBe("2025-01-01");
  });
});
