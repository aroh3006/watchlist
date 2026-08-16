import { describe, it, expect } from "vitest";
import { ruleSatisfied, type UserSignals } from "@/lib/badges/engine";
import { BADGE_DEFINITIONS } from "@/lib/badges/definitions";

const baseSignals: UserSignals = {
  episodesWatched: 0,
  moviesWatched: 0,
  showsCompleted: 0,
  seasonsCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
  genresExplored: 0,
  listsCreated: 0,
  maxEpisodesInSingleDay: 0,
  hasFavorite: false,
};

describe("badge rule engine", () => {
  it("every badge key is unique", () => {
    const keys = BADGE_DEFINITIONS.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("does not award threshold badges below their threshold", () => {
    const signals = { ...baseSignals, episodesWatched: 9 };
    const badge = BADGE_DEFINITIONS.find((b) => b.key === "episodes-10")!;
    expect(ruleSatisfied(badge.rule, signals)).toBe(false);
  });

  it("awards threshold badges once the threshold is met", () => {
    const signals = { ...baseSignals, episodesWatched: 10 };
    const badge = BADGE_DEFINITIONS.find((b) => b.key === "episodes-10")!;
    expect(ruleSatisfied(badge.rule, signals)).toBe(true);
  });

  it("awards streak badges based on current streak, not longest", () => {
    const signals = { ...baseSignals, currentStreak: 7, longestStreak: 7 };
    const weekly = BADGE_DEFINITIONS.find((b) => b.key === "streak-7")!;
    const monthly = BADGE_DEFINITIONS.find((b) => b.key === "streak-30")!;
    expect(ruleSatisfied(weekly.rule, signals)).toBe(true);
    expect(ruleSatisfied(monthly.rule, signals)).toBe(false);
  });

  it("first-episode badge only requires one watched episode", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.key === "first-episode")!;
    expect(ruleSatisfied(badge.rule, baseSignals)).toBe(false);
    expect(ruleSatisfied(badge.rule, { ...baseSignals, episodesWatched: 1 })).toBe(true);
  });
});
