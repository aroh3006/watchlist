# Watchlist

Watchlist is a personal TV-show and movie tracking app. It's a modern, original successor to the
discontinued TV Time experience. It recreates the tracking workflows, statistics, discovery
experience, and import capabilities that made TV Time useful, with its own branding, visual
design, and data architecture.

**Live at [watchlist-aroh.vercel.app](https://watchlist-aroh.vercel.app/).**

## What's implemented

- **Tracking**: follow shows/movies, mark episodes/seasons/whole shows watched (one click),
  undo, rewatch history, ratings, favorites, custom lists.
- **Watch Next**: a home dashboard built around "what should I watch next" (continue watching,
  next episode, recently watched/added, upcoming, favorites, recommendations).
- **Shows / Movies**: library views (Watching/Completed/Paused/Planned/Dropped/Favorites), rich
  detail pages (seasons, episodes, cast, similar titles), episode detail pages with spoiler-gated
  watch history and reactions.
- **Discover**: search (title, genre, cast, character), genre browsing, trending.
- **Upcoming**: a day-grouped calendar of upcoming episodes/movies for what you follow.
- **Statistics**: TV time, movie time, monthly activity chart, genre/network breakdowns, top
  shows, completion rate. All derived from real watch events, never fabricated.
- **Profile & contribution heatmap**: a GitHub-style, timezone-aware watch-activity heatmap with
  current/longest streaks, active days, and per-day tooltips. Built from the same watch-event
  log that powers statistics (see [Watch activity heatmap](#watch-activity-heatmap)).
- **Badges**: a rules-engine (`src/lib/badges`) that evaluates achievement definitions against a
  user's real stats. No badge is hard-coded into a page.
- **Import**: ZIP-of-CSVs or single-CSV import with smart column mapping, title matching
  (external ID → exact title → fuzzy → manual review), an ambiguous-match review UI, and
  idempotent commits (re-running the same file never duplicates history). See
  [Import architecture](#import-architecture).
- **Export**: JSON, single-file CSV, and a ZIP of per-table CSVs, with spreadsheet
  formula-injection protection on every exported cell.
- **Auth**: email/username + password (NextAuth credentials), per-user data isolation enforced
  at the query layer.
- **Tests**: Vitest unit tests (CSV parsing, ZIP zip-slip protection, field mapping, streak math,
  timezone date-keying, badge rules, CSV export sanitization) plus integration tests against the
  real Prisma/SQLite client for watch tracking and idempotency.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **SQLite** for local dev (swap `DATABASE_URL` to Postgres for production, the
  schema avoids native enums specifically so this swap needs no code changes)
- **Tailwind CSS**, an original dark-first design system (no TV Time visual assets)
- **NextAuth** (credentials provider)
- **Vitest** for unit/integration tests
- No external metadata API is required to run the app. See below.

## Metadata provider architecture

Watchlist never hard-codes itself to one metadata source. `src/lib/metadata/types.ts` defines a
provider-agnostic `MetadataProvider` interface (`searchShows`, `getShow`, `searchMovies`,
`getMovie`, `getPerson`, `trending`); the rest of the app only ever talks to that interface.

- **`local`** (default): `LocalDatasetProvider`, a small, entirely original fictional
  catalog (`src/lib/metadata/localData.ts`) with generated placeholder artwork
  (`placeholderImage.ts`, SVG gradients, no third-party images). Nothing is scraped or copied
  from TheTVDB, TMDB, or any proprietary database. This lets the app run fully offline.
- **`tmdb`**: `TmdbProvider`, a real adapter for [The Movie Database](https://www.themoviedb.org/documentation/api),
  an openly licensed metadata source usable as a legal stand-in for TheTVDB's historical role.
  Set `METADATA_PROVIDER=tmdb` and `METADATA_TMDB_API_KEY=...` in `.env` to use it.

Every show/movie/person also carries an `ExternalId` row per provider (`src/lib/metadata/sync.ts`
materializes provider data into Watchlist's own tables and records the provider id). This is what
makes a future provider switch, or dropping in a licensed local dataset, possible without a
database redesign. Watchlist's own IDs are always primary; provider IDs are just references.

## Watch events, not booleans

`EpisodeWatch` / `MovieWatch` are event logs (`userId`, `watchedAt`, `source`, `dedupeKey`), not a
boolean "watched" flag. This is what makes rewatches, accurate historical dates, and idempotent
imports possible. "Currently watched" is derived by querying for at least one event; statistics
and the heatmap are aggregated from this same log.

## Watch activity heatmap

The profile heatmap (`src/components/ContributionHeatmap.tsx`) is fed by
`DailyWatchActivity`, a **materialized rollup** of `EpisodeWatch`/`MovieWatch`
(`src/lib/stats/activity.ts::recomputeDailyActivityForUser`), recomputed after every watch
mutation and after every import commit. It is never a second source of truth. It can always be
rebuilt from the event log.

- **Timezone-aware**: each user has a `Profile.timezone` (defaults to `DEFAULT_TIMEZONE`, browser
  timezone at signup, editable on the Profile page). A watch at 23:30 local time is bucketed into
  the *local* calendar day, not UTC. See `src/lib/time.ts`.
- **Streak definition**: the current streak is the count of consecutive active days ending at
  *today or yesterday*. If you watched yesterday but haven't yet today, the streak is still
  considered live (you have until the end of today to keep it going). If the most recent activity
  is older than yesterday, the current streak is 0. Longest streak is the max run across all
  history. See `src/lib/stats/activity.ts::computeStreaks`.
- **Activity score**: `episodes*1 + movies*2`, bucketed into 5 levels (0-4). A movie counts for
  roughly two episodes of attention. See `activityScoreFor`.
- Accessible: every cell has a full text label (`"September 4, 2026: 4 episodes, 1 movie, 312
  minutes watched."`), keyboard-focusable, respects `prefers-reduced-motion`.

## Import architecture

Files: `src/lib/import/{csv,zip,fieldMapping,matching,pipeline}.ts`.

1. **Upload** (`POST /api/import/upload`, `.zip` or `.csv`, size-limited by
   `IMPORT_MAX_UPLOAD_BYTES`).
2. **Extract**: ZIP entries are read into memory only (nothing touches disk). Any entry with
   a traversal path (`../`), absolute path, or non-`.csv` extension is rejected and reported, not
   extracted (zip-slip protection, `src/lib/import/zip.ts`).
3. **Parse**: `papaparse`, tolerant of BOM, CRLF/LF, quoted commas, missing/unknown columns.
4. **Map**: column names are matched against a synonym table (`title`/`show`/`series`/`movie`,
   `season`, `episode_number`, `watched_at`/`watch_date`/`date`, `rating`, `favorite`, `status`,
   `imdb_id`/`tmdb_id`/`tvdb_id`, …). Unrecognized columns are preserved (`extra`), never dropped.
5. **Match**: priority order is exact external ID (imdb/tmdb/tvdb via `ExternalId`), then exact
   normalized title, then fuzzy title, then ambiguous (multiple candidates, never auto-picked),
   then unmatched.
6. **Review**: ambiguous rows get a review screen (`/import`) with candidate cards. "Apply to
   all similar" bulk-resolves rows with an identical raw title field.
7. **Commit**: matched/resolved rows become `EpisodeWatch`/`MovieWatch`/`Rating`/`Favorite`
   records. Each event's `dedupeKey` is a hash of `(userId, kind, entityId, watchedAt, source)`.
   **Re-running the same import is always safe.** It upserts, never duplicates.
8. **Report**: every `ImportJob` tracks matched/ambiguous/unmatched/duplicate/error row counts
   and a per-row audit trail (`ImportRow.rawData` keeps the original row verbatim).

This is designed as a **TV Time-export-compatible generic CSV/ZIP importer**. TV Time's
exact export schema isn't known/available here, so the importer works from real column names rather
than one hard-coded shape. If a TV Time export ZIP is provided later, it should import without
any code changes (assuming its columns are recognizable; extend the synonym table in
`fieldMapping.ts` if a column name isn't recognized).

**Known simplification**: staging + matching runs synchronously inside the upload request rather
than on a background queue. `ImportJob`/`ImportFile`/`ImportRow` are already shaped so a queue
worker (BullMQ, a cron-polled job table, etc.) could take over without a schema change. This is
the natural next step before importing very large exports.

## Security notes

- ZIP extraction: in-memory only, zip-slip / path-traversal / absolute-path entries rejected.
- CSV export: values starting with `=`, `+`, `-`, `@`, tab, or CR are prefixed with `'` to
  neutralize spreadsheet formula injection (`src/lib/export/csv.ts`).
- All tracking/list/import/export API routes call `requireUser()` and scope every query by the
  authenticated user's ID. There is no endpoint that accepts a client-supplied user ID.
- Passwords are hashed with bcrypt; sessions are JWT-based (NextAuth).
- API errors are logged server-side and returned to the client as a generic message. No stack
  traces, secrets, or internal paths are ever sent to the browser.

## Getting started

```bash
npm install
cp .env.example .env      # generate a real NEXTAUTH_SECRET, see below
npm run db:push           # create the local SQLite database from the schema
npm run db:seed           # original fictional demo catalog + a demo user with real watch history
npm run dev                # http://localhost:3000
```

Generate a secret for `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Demo login after seeding: **demo@watchlist.app** / **watchlist-demo**

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run db:push` | Sync `prisma/schema.prisma` to the SQLite database (dev) |
| `npm run db:migrate` | Create a versioned migration (use once you're past rapid prototyping) |
| `npm run db:seed` | Seed the original demo catalog + demo user |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

### Environment variables (`.env`)

See `.env.example` for the full list with comments: `DATABASE_URL`, `NEXTAUTH_SECRET`,
`NEXTAUTH_URL`, `METADATA_PROVIDER` (`local` | `tmdb`), `METADATA_TMDB_API_KEY`,
`DEFAULT_TIMEZONE`, `IMPORT_MAX_UPLOAD_BYTES`.

## Database

SQLite for local dev via Prisma (`prisma/schema.prisma`, `prisma/dev.db`, gitignored). SQLite
has no native enum type, so status/type columns are plain `String` columns validated against TS
union types in `src/lib/constants.ts` (e.g. `WatchStatus`, `ReactionType`). Switching
`DATABASE_URL` to Postgres later can promote these back to native Prisma enums without touching
call sites, since the values are identical. No other code changes needed.

Full schema covers: users/profiles, shows/seasons/episodes, movies, people/characters/cast,
genres/networks, per-user tracking state (`UserShow`/`UserMovie`), watch events
(`EpisodeWatch`/`MovieWatch`), the daily activity rollup, ratings, reactions, favorites, custom
lists, badges, notifications, external IDs, and the full import job/file/row pipeline.

## Testing

```bash
npm run test
```

37 tests across CSV parsing (BOM/CRLF/quoted values), ZIP extraction (including a zip-slip
rejection test built from a maliciously-named entry), CSV field-mapping/synonym recognition,
timezone-aware date-keying, streak math (including the "watched yesterday, streak still live"
case), badge rule evaluation, CSV export formula-injection sanitization, and an integration suite
against the real Prisma/SQLite client verifying that marking a show watched twice doesn't
duplicate watch events.

## Known limitations / next steps

- Import staging/matching is synchronous per-request rather than queued (see
  [Import architecture](#import-architecture)). Fine for personal-export-sized files, worth a
  background queue before very large imports.
- The recommendation engine (`src/lib/recommendations.ts`) is a deterministic genre-overlap +
  popularity scorer, intentionally structured so a learned/ML ranking model could replace
  `scoreCandidates` later without touching callers.
- Cast/person photos use a placeholder avatar circle in the demo dataset (original fictional
  content ships with no photos to avoid implying real people); a real metadata provider (TMDB)
  supplies real `imageUrl`s.
- OAuth login providers are not wired up (spec treats this as optional); credentials auth is
  fully functional.
