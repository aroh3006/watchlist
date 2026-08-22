/**
 * SQLite has no native enum type, so status/type columns are plain strings
 * validated against these TS unions at the application layer. Switching to
 * Postgres later can promote these back to native Prisma enums without any
 * call-site changes, since values are identical.
 */

export const SHOW_STATUSES = ["RETURNING", "ENDED", "CANCELLED", "IN_PRODUCTION", "PLANNED"] as const;
export type ShowStatus = (typeof SHOW_STATUSES)[number];

export const WATCH_STATUSES = ["PLANNED", "WATCHING", "PAUSED", "COMPLETED", "DROPPED", "NOT_WATCHED"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const RATING_TARGET_TYPES = ["SHOW", "SEASON", "EPISODE", "MOVIE"] as const;
export type RatingTargetType = (typeof RATING_TARGET_TYPES)[number];

export const REACTION_TYPES = ["LOVE", "LIKE", "MEH", "DISLIKE", "MIND_BLOWN", "FUNNY", "SAD", "SCARY"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export const FAVORITE_TARGET_TYPES = ["SHOW", "MOVIE"] as const;
export type FavoriteTargetType = (typeof FAVORITE_TARGET_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "UPCOMING_EPISODE",
  "NEW_EPISODE",
  "IMPORT_COMPLETE",
  "IMPORT_NEEDS_ATTENTION",
  "BADGE_EARNED",
  "RECOMMENDATION",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const EXTERNAL_ENTITY_TYPES = ["SHOW", "MOVIE", "PERSON", "EPISODE"] as const;
export type ExternalEntityType = (typeof EXTERNAL_ENTITY_TYPES)[number];

export const IMPORT_JOB_STATUSES = [
  "PENDING",
  "VALIDATING",
  "EXTRACTING",
  "MAPPING",
  "MATCHING",
  "NEEDS_REVIEW",
  "IMPORTING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
] as const;
export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];

export const IMPORT_ROW_STATUSES = [
  "PENDING",
  "MATCHED",
  "AMBIGUOUS",
  "UNMATCHED",
  "DUPLICATE",
  "ERROR",
  "RESOLVED",
  "SKIPPED",
] as const;
export type ImportRowStatus = (typeof IMPORT_ROW_STATUSES)[number];

export const REACTION_EMOJI: Record<ReactionType, string> = {
  LOVE: "❤️",
  LIKE: "👍",
  MEH: "😐",
  DISLIKE: "👎",
  MIND_BLOWN: "🤯",
  FUNNY: "😂",
  SAD: "😢",
  SCARY: "😱",
};

export const SHOW_STATUS_LABEL: Record<ShowStatus, string> = {
  RETURNING: "Returning",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
  IN_PRODUCTION: "In Production",
  PLANNED: "Planned",
};

export const WATCH_STATUS_LABEL: Record<WatchStatus, string> = {
  PLANNED: "Planned",
  WATCHING: "Watching",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  NOT_WATCHED: "Not Watched",
};
