import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { markEpisodeWatched, markShowWatched, getShowProgress } from "@/lib/tracking";

/**
 * Integration tests against the real (local SQLite) Prisma client. Creates
 * an isolated test user/show and cleans up via cascade delete afterward —
 * never touches the demo user's data.
 */

let userId: string;
let showId: string;
let episodeIds: string[] = [];

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: "vitest-tracking@example.com", username: "vitest_tracking", passwordHash: "x" },
  });
  userId = user.id;

  const show = await prisma.show.create({
    data: { title: "Vitest Test Show", slug: `vitest-test-show-${Date.now()}`, status: "ENDED" },
  });
  showId = show.id;

  const season = await prisma.season.create({ data: { showId, seasonNumber: 1 } });
  const episodes = await Promise.all(
    [1, 2, 3].map((n) => prisma.episode.create({ data: { seasonId: season.id, showId, episodeNumber: n, title: `Ep ${n}`, runtime: 30 } }))
  );
  episodeIds = episodes.map((e) => e.id);
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.show.delete({ where: { id: showId } }).catch(() => {});
});

describe("episode watch tracking", () => {
  it("marking an episode watched creates exactly one watch event", async () => {
    await markEpisodeWatched(userId, episodeIds[0]);
    const count = await prisma.episodeWatch.count({ where: { userId, episodeId: episodeIds[0] } });
    expect(count).toBe(1);
  });

  it("updates show progress after marking an episode watched", async () => {
    const progress = await getShowProgress(userId, showId);
    expect(progress.watchedEpisodes).toBe(1);
    expect(progress.totalEpisodes).toBe(3);
    expect(progress.nextEpisode?.id).toBe(episodeIds[1]);
  });

  it("marking the whole show watched completes every episode idempotently", async () => {
    await markShowWatched(userId, showId);
    await markShowWatched(userId, showId); // second call must not duplicate

    const watches = await prisma.episodeWatch.findMany({ where: { userId, episode: { showId } } });
    expect(watches).toHaveLength(3);

    const userShow = await prisma.userShow.findUnique({ where: { userId_showId: { userId, showId } } });
    expect(userShow?.status).toBe("COMPLETED");
  });
});
