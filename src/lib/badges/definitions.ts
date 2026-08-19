/**
 * Declarative badge catalogue. Adding a new badge means adding an entry
 * here plus (if it needs a new signal) a case in the evaluator switch in
 * engine.ts. The UI, database seeding, and award logic all read from this
 * single list rather than hard-coding each badge individually.
 */

export type BadgeCategory =
  | "discovery"
  | "consistency"
  | "completion"
  | "binge"
  | "movie_buff"
  | "explorer"
  | "collector";

export type BadgeRule =
  | { kind: "episodesWatched"; threshold: number }
  | { kind: "moviesWatched"; threshold: number }
  | { kind: "showsCompleted"; threshold: number }
  | { kind: "seasonsCompleted"; threshold: number }
  | { kind: "currentStreak"; threshold: number }
  | { kind: "longestStreak"; threshold: number }
  | { kind: "genresExplored"; threshold: number }
  | { kind: "listsCreated"; threshold: number }
  | { kind: "episodesInSingleDay"; threshold: number }
  | { kind: "firstEpisodeWatched" }
  | { kind: "firstMovieWatched" }
  | { kind: "firstShowCompleted" }
  | { kind: "firstFavorite" };

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: number;
  iconKey: string;
  rule: BadgeRule;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: "first-episode", name: "First Frame", description: "Watched your first episode.", category: "discovery", tier: 1, iconKey: "play", rule: { kind: "firstEpisodeWatched" } },
  { key: "first-movie", name: "Opening Night", description: "Watched your first movie.", category: "discovery", tier: 1, iconKey: "film", rule: { kind: "firstMovieWatched" } },
  { key: "first-favorite", name: "Starstruck", description: "Favorited your first title.", category: "discovery", tier: 1, iconKey: "star", rule: { kind: "firstFavorite" } },

  { key: "episodes-10", name: "Getting Started", description: "Watched 10 episodes.", category: "collector", tier: 1, iconKey: "layers", rule: { kind: "episodesWatched", threshold: 10 } },
  { key: "episodes-100", name: "Dedicated Viewer", description: "Watched 100 episodes.", category: "collector", tier: 2, iconKey: "layers", rule: { kind: "episodesWatched", threshold: 100 } },
  { key: "episodes-1000", name: "Certified Binger", description: "Watched 1,000 episodes.", category: "collector", tier: 3, iconKey: "layers", rule: { kind: "episodesWatched", threshold: 1000 } },

  { key: "movies-10", name: "Movie Night Regular", description: "Watched 10 movies.", category: "movie_buff", tier: 1, iconKey: "clapperboard", rule: { kind: "moviesWatched", threshold: 10 } },
  { key: "movies-100", name: "Movie Buff", description: "Watched 100 movies.", category: "movie_buff", tier: 2, iconKey: "clapperboard", rule: { kind: "moviesWatched", threshold: 100 } },

  { key: "first-season", name: "Season's End", description: "Completed a full season.", category: "completion", tier: 1, iconKey: "check-circle", rule: { kind: "seasonsCompleted", threshold: 1 } },
  { key: "first-series", name: "Series Finale", description: "Completed an entire series.", category: "completion", tier: 1, iconKey: "trophy", rule: { kind: "firstShowCompleted" } },
  { key: "shows-completed-5", name: "Completionist", description: "Completed 5 full shows.", category: "completion", tier: 2, iconKey: "trophy", rule: { kind: "showsCompleted", threshold: 5 } },
  { key: "shows-completed-25", name: "Master Completionist", description: "Completed 25 full shows.", category: "completion", tier: 3, iconKey: "trophy", rule: { kind: "showsCompleted", threshold: 25 } },

  { key: "streak-7", name: "Weekly Streak", description: "Watched something 7 days in a row.", category: "consistency", tier: 1, iconKey: "flame", rule: { kind: "currentStreak", threshold: 7 } },
  { key: "streak-30", name: "Monthly Streak", description: "Watched something 30 days in a row.", category: "consistency", tier: 2, iconKey: "flame", rule: { kind: "currentStreak", threshold: 30 } },
  { key: "longest-streak-100", name: "Unstoppable", description: "Reached a 100-day streak.", category: "consistency", tier: 3, iconKey: "flame", rule: { kind: "longestStreak", threshold: 100 } },

  { key: "binge-5", name: "Binge Session", description: "Watched 5+ episodes in a single day.", category: "binge", tier: 1, iconKey: "zap", rule: { kind: "episodesInSingleDay", threshold: 5 } },
  { key: "binge-10", name: "Marathon Runner", description: "Watched 10+ episodes in a single day.", category: "binge", tier: 2, iconKey: "zap", rule: { kind: "episodesInSingleDay", threshold: 10 } },

  { key: "genres-5", name: "Genre Hopper", description: "Watched shows or movies across 5 different genres.", category: "explorer", tier: 1, iconKey: "compass", rule: { kind: "genresExplored", threshold: 5 } },
  { key: "genres-10", name: "Genre Explorer", description: "Watched shows or movies across 10 different genres.", category: "explorer", tier: 2, iconKey: "compass", rule: { kind: "genresExplored", threshold: 10 } },

  { key: "lists-3", name: "List Maker", description: "Created 3 custom lists.", category: "collector", tier: 1, iconKey: "list", rule: { kind: "listsCreated", threshold: 3 } },
];
