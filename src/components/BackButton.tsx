"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "./icons";

export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className={`w-8 h-8 rounded-full border border-border bg-bg-raised/90 backdrop-blur flex items-center justify-center text-ink-muted hover:text-ink hover:border-brand-400 transition-colors focus-ring ${className}`}
    >
      <ArrowLeftIcon width={16} height={16} />
    </button>
  );
}
