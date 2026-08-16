import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SpoilerGate } from "@/components/SpoilerGate";
import { ReactionBar } from "@/components/ReactionBar";
import { EpisodeWatchToggle } from "@/components/EpisodeWatchToggle";
import { BackButton } from "@/components/BackButton";
import type { ReactionType } from "@/lib/constants";

export default async function EpisodeDetailPage({ params }: { params: { slug: string; episodeId: string } }) {
  const user = await requireUser();
  const episode = await prisma.episode.findUnique({
    where: { id: params.episodeId },
    include: { season: { include: { show: true } }, cast: { include: { person: true, character: true } } },
  });
  if (!episode || episode.season.show.slug !== params.slug) notFound();

  const [watch, rating, reaction, otherWatches, showEpisodes, watchedEpisodeIds] = await Promise.all([
    prisma.episodeWatch.findFirst({ where: { userId: user.id, episodeId: episode.id } }),
    prisma.rating.findFirst({ where: { userId: user.id, episodeId: episode.id } }),
    prisma.reaction.findFirst({ where: { userId: user.id, episodeId: episode.id } }),
    prisma.episodeWatch.findMany({ where: { userId: user.id, episodeId: episode.id }, orderBy: { watchedAt: "asc" } }),
    prisma.episode.findMany({
      where: { showId: episode.season.show.id },
      orderBy: [{ season: { seasonNumber: "asc" } }, { episodeNumber: "asc" }],
      select: { id: true },
    }),
    prisma.episodeWatch.findMany({ where: { userId: user.id, episode: { showId: episode.season.show.id } }, select: { episodeId: true } }),
  ]);

  const watched = !!watch;
  const watchedIdSet = new Set(watchedEpisodeIds.map((w) => w.episodeId));
  const currentIndex = showEpisodes.findIndex((e) => e.id === episode.id);
  const previousUnwatchedEpisodeIds =
    currentIndex > 0
      ? showEpisodes.slice(0, currentIndex).filter((e) => !watchedIdSet.has(e.id)).map((e) => e.id)
      : [];

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
      <div className="flex items-center gap-2">
        <BackButton />
        <Link href={`/shows/${episode.season.show.slug}`} className="text-sm text-brand-300 hover:underline focus-ring rounded">
          {episode.season.show.title}
        </Link>
      </div>

      <div className="mt-4 rounded-xl2 overflow-hidden bg-bg-overlay border border-border-subtle aspect-video">
        {episode.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={episode.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-ink-muted uppercase tracking-wide">
            Season {episode.season.seasonNumber} · Episode {episode.episodeNumber}
          </p>
          <h1 className="text-xl md:text-2xl font-bold mt-1">{episode.title}</h1>
          <p className="text-xs text-ink-muted mt-1">
            {episode.airDate ? new Date(episode.airDate).toLocaleDateString() : "Air date TBA"}
            {episode.runtime ? ` · ${episode.runtime}m` : ""}
            {episode.voteAverage ? ` · ★ ${episode.voteAverage.toFixed(1)}` : ""}
          </p>
        </div>
        <EpisodeWatchToggle
          episodeId={episode.id}
          initialWatched={watched}
          rewatchCount={otherWatches.length}
          previousUnwatchedEpisodeIds={previousUnwatchedEpisodeIds}
        />
      </div>

      <p className="text-sm text-ink-muted mt-4">{episode.overview}</p>

      {episode.cast.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-2">Cast</h2>
          <div className="flex flex-wrap gap-2">
            {episode.cast.map((c) => (
              <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-bg-overlay border border-border-subtle text-ink-muted">
                {c.person.name}
                {c.character ? ` as ${c.character.name}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Your reaction</h2>
        <ReactionBar target="episode" targetId={episode.id} initialReaction={reaction?.type as ReactionType | null} />
      </div>

      {watch && rating && (
        <p className="text-sm text-ink-muted mt-4">Your rating: {rating.score}/10</p>
      )}

      {otherWatches.length > 1 && (
        <div className="mt-6">
          <SpoilerGate watched={watched}>
            <h2 className="text-sm font-semibold mb-2">Watch history</h2>
            <ul className="text-sm text-ink-muted space-y-1">
              {otherWatches.map((w) => (
                <li key={w.id}>{w.watchedAt.toLocaleString()} {w.source !== "manual" && `(${w.source})`}</li>
              ))}
            </ul>
          </SpoilerGate>
        </div>
      )}
    </div>
  );
}
