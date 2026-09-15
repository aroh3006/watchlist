import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ListDetailBody } from "@/components/ListDetailBody";
import type { ListItemData } from "@/components/ListItemsGrid";

export default async function ListDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const list = await prisma.customList.findUnique({
    where: { id: params.id },
    include: { items: { include: { show: true, movie: true }, orderBy: { position: "asc" } } },
  });
  if (!list || list.userId !== user.id) notFound();

  const items = list.items
    .map((item): ListItemData | null =>
      item.show
        ? { id: item.id, href: `/shows/${item.show.slug}`, title: item.show.title, posterUrl: item.show.posterUrl }
        : item.movie
          ? { id: item.id, href: `/movies/${item.movie.slug}`, title: item.movie.title, posterUrl: item.movie.posterUrl }
          : null
    )
    .filter((item): item is ListItemData => item !== null);

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <ListDetailBody
        listId={list.id}
        name={list.name}
        description={list.description}
        visibility={list.isPublic ? "Public" : "Private"}
        items={items}
      />
    </div>
  );
}
