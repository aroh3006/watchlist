"use client";

import { useState } from "react";
import Link from "next/link";
import { PlusIcon, CheckCircleIcon } from "./icons";
import { SafeImage } from "./SafeImage";

export function DiscoverCard({
  title,
  posterUrl,
  subtitle,
  type,
  provider,
  externalId,
}: {
  title: string;
  posterUrl?: string;
  subtitle?: string;
  type: "show" | "movie";
  provider: string;
  externalId: string;
}) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    const res = await fetch("/api/library/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, provider, externalId, status: "PLANNED" }),
    });
    setLoading(false);
    if (res.ok) setAdded(true);
  }

  const openHref = `/discover/open?type=${type}&provider=${encodeURIComponent(provider)}&externalId=${encodeURIComponent(externalId)}`;

  return (
    <div className="w-[140px] sm:w-[160px] shrink-0">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-bg-overlay border border-border-subtle">
        <Link href={openHref} className="block w-full h-full focus-ring" aria-label={`Open ${title}`}>
          <SafeImage src={posterUrl} seed={openHref} title={title} kind="poster" loading="lazy" className="w-full h-full object-cover" />
        </Link>
        <button
          onClick={add}
          disabled={added || loading}
          aria-label={added ? `${title} added to your library` : `Add ${title} to your library`}
          className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1.5 text-white hover:bg-brand-500 transition-colors focus-ring disabled:hover:bg-black/70"
        >
          {added ? <CheckCircleIcon width={16} height={16} /> : <PlusIcon width={16} height={16} />}
        </button>
      </div>
      <Link href={openHref} className="focus-ring rounded">
        <p className="mt-2 text-sm font-medium text-ink truncate">{title}</p>
      </Link>
      {subtitle && <p className="text-xs text-ink-muted truncate">{subtitle}</p>}
    </div>
  );
}
