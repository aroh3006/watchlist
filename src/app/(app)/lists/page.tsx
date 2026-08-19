import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/Section";
import { CreateListForm } from "@/components/CreateListForm";
import Link from "next/link";
import { ListIcon } from "@/components/icons";
import { SafeImage } from "@/components/SafeImage";

export default async function ListsPage() {
  const user = await requireUser();
  const lists = await prisma.customList.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { items: true } }, items: { take: 4, include: { show: true, movie: true } } },
  });

  return (
    <div className="py-6 md:py-8 px-4 md:px-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Lists</h1>
          <p className="text-sm text-ink-muted mt-1">Curate your own watch collections.</p>
        </div>
        <CreateListForm />
      </div>

      {lists.length === 0 ? (
        <EmptyState title="No lists yet" body="Create your first list to start curating." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="rounded-xl2 border border-border bg-bg-raised p-4 hover:border-brand-700 transition-colors focus-ring"
            >
              <div className="flex items-center gap-2 mb-2">
                <ListIcon width={18} height={18} className="text-ink-muted" />
                <h2 className="font-medium truncate">{list.name}</h2>
                {!list.isPublic && <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-overlay text-ink-faint ml-auto">Private</span>}
              </div>
              {list.description && <p className="text-xs text-ink-muted mb-3 line-clamp-2">{list.description}</p>}
              <div className="flex -space-x-3">
                {list.items.map((item) => {
                  const poster = item.show?.posterUrl ?? item.movie?.posterUrl;
                  const itemTitle = item.show?.title ?? item.movie?.title ?? "";
                  return (
                    <div key={item.id} className="w-10 h-14 rounded-md overflow-hidden border-2 border-bg-raised bg-bg-overlay">
                      <SafeImage src={poster} seed={item.id} title={itemTitle} kind="poster" className="w-full h-full object-cover" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-ink-faint mt-3">{list._count.items} item{list._count.items !== 1 ? "s" : ""}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
