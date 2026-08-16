import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureShowSynced, ensureMovieSynced } from "@/lib/metadata/sync";

/**
 * Discover results come straight from the metadata provider and don't exist
 * in our own tables yet (no slug to link to). This materializes the item on
 * first click, then redirects into its real detail page.
 */
export default async function OpenDiscoverItemPage({
  searchParams,
}: {
  searchParams: { type?: string; provider?: string; externalId?: string };
}) {
  await requireUser();
  const { type, provider, externalId } = searchParams;
  if (!provider || !externalId || (type !== "show" && type !== "movie")) notFound();

  if (type === "movie") {
    const movieId = await ensureMovieSynced(provider, externalId);
    const movie = await prisma.movie.findUniqueOrThrow({ where: { id: movieId }, select: { slug: true } });
    redirect(`/movies/${movie.slug}`);
  } else {
    const showId = await ensureShowSynced(provider, externalId);
    const show = await prisma.show.findUniqueOrThrow({ where: { id: showId }, select: { slug: true } });
    redirect(`/shows/${show.slug}`);
  }
}
