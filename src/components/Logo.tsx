/** Watchlist's mascot, the hand-drawn raccoon-with-coffee artwork. */
export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/raccoon-logo.png" alt="" className={className} style={{ objectFit: "contain" }} />
  );
}
