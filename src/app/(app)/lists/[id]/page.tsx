import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PosterGrid, PosterCard } from "@/components/PosterCard";
import { EmptyState } from "@/components/Section";
import { DeleteListButton } from "@/components/DeleteListButton";

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const list = await prisma.customList.findUnique({
    where: { id: params.id },
    include: { items: { include: { show: true, movie: true }, orderBy: { position: "asc" } } },
  });
  if (!list || list.userId !== user.id) notFound();

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{list.name}</h1>
          {list.description && <p className="text-sm text-ink-muted mt-1">{list.description}</p>}
          <p className="text-xs text-ink-faint mt-1">{list.isPublic ? "Public" : "Private"} · {list.items.length} items</p>
        </div>
        <DeleteListButton listId={list.id} />
      </div>

      {list.items.length === 0 ? (
        <EmptyState title="This list is empty" body="Add shows or movies from their detail page." />
      ) : (
        <PosterGrid>
          {list.items.map((item) =>
            item.show ? (
              <PosterCard key={item.id} href={`/shows/${item.show.slug}`} title={item.show.title} posterUrl={item.show.posterUrl} />
            ) : item.movie ? (
              <PosterCard key={item.id} href={`/movies/${item.movie.slug}`} title={item.movie.title} posterUrl={item.movie.posterUrl} />
            ) : null
          )}
        </PosterGrid>
      )}
    </div>
  );
}
