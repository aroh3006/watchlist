"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { HeatmapCell } from "@/lib/stats/heatmap";

const LEVEL_COLORS = ["bg-activity-0", "bg-activity-1", "bg-activity-2", "bg-activity-3", "bg-activity-4"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

// The 12-month view has around 53 week columns. At the old fixed 12px cell
// plus 4px gap, that is close to 850px wide before even counting the weekday
// label column, wider than the card on plenty of common desktop widths. Cell
// size is now computed from the container's actual width so the whole range
// fits without scrolling, and only falls back to scrolling once it hits
// MIN_CELL (mainly narrow mobile widths).
const MAX_CELL = 12; // px, same size the cells used to be fixed at
const MIN_CELL = 7; // px, floor so a cell stays visible and easy to hit
const GAP = 3; // px, a touch tighter than the old 4px gap to buy a little room
const LABEL_COLUMN_WIDTH = 28; // px, width reserved for the weekday labels

function cellLabel(cell: HeatmapCell): string {
  const date = new Date(cell.date + "T00:00:00Z");
  // A fixed locale, not undefined, the server and a visiting browser can
  // otherwise resolve "undefined" to different locales and disagree on the
  // exact string (day-before-month order, punctuation), which is a
  // hydration mismatch since this is a client component.
  const dateStr = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  if (cell.episodeCount === 0 && cell.movieCount === 0) return `${dateStr}: no watching activity.`;
  const parts: string[] = [];
  if (cell.episodeCount > 0) parts.push(`${cell.episodeCount} episode${cell.episodeCount !== 1 ? "s" : ""}`);
  if (cell.movieCount > 0) parts.push(`${cell.movieCount} movie${cell.movieCount !== 1 ? "s" : ""}`);
  return `${dateStr}: ${parts.join(", ")}, ${cell.totalMinutes} minutes watched.`;
}

interface Column {
  weekStartDate: string;
  cells: (HeatmapCell | null)[]; // 7 entries, Sun..Sat
}

function buildColumns(cells: HeatmapCell[]): Column[] {
  if (cells.length === 0) return [];
  const columns: Column[] = [];
  const firstDow = new Date(cells[0].date + "T00:00:00Z").getUTCDay();

  let current: (HeatmapCell | null)[] = new Array(firstDow).fill(null);
  let weekStart = cells[0].date;

  for (const cell of cells) {
    const dow = new Date(cell.date + "T00:00:00Z").getUTCDay();
    if (dow === 0 && current.some((c) => c !== null)) {
      columns.push({ weekStartDate: weekStart, cells: current });
      current = [];
      weekStart = cell.date;
    }
    current[dow] = cell;
  }
  if (current.some((c) => c !== null)) {
    while (current.length < 7) current.push(null);
    columns.push({ weekStartDate: weekStart, cells: current });
  }
  return columns;
}

export function ContributionHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const columns = useMemo(() => buildColumns(cells), [cells]);
  const [active, setActive] = useState<HeatmapCell | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || columns.length === 0) return;

    function fit() {
      const available = el!.clientWidth - LABEL_COLUMN_WIDTH - GAP;
      const raw = (available - (columns.length - 1) * GAP) / columns.length;
      setCellSize(Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(raw))));
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [columns.length]);

  const pitch = cellSize + GAP;

  const monthLabels = useMemo(() => {
    const labels: { colIndex: number; label: string }[] = [];
    let lastMonth = -1;
    columns.forEach((col, i) => {
      const firstReal = col.cells.find((c) => c !== null);
      if (!firstReal) return;
      const month = new Date(firstReal.date + "T00:00:00Z").getUTCMonth();
      if (month !== lastMonth) {
        labels.push({ colIndex: i, label: MONTH_NAMES[month] });
        lastMonth = month;
      }
    });
    return labels;
  }, [columns]);

  return (
    <div>
      <div ref={scrollRef} className="w-full overflow-x-auto pb-2">
        <div className="relative h-4 mb-1" style={{ marginLeft: LABEL_COLUMN_WIDTH + GAP }}>
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute text-[11px] text-ink-faint"
              style={{ left: `${m.colIndex * pitch}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="flex" style={{ gap: `${GAP}px` }}>
          <div className="flex flex-col shrink-0" style={{ width: LABEL_COLUMN_WIDTH, gap: `${GAP}px` }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="text-[10px] text-ink-faint leading-none flex items-center" style={{ height: cellSize }}>
                {label}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col"
            style={{ gridTemplateRows: `repeat(7, ${cellSize}px)`, gap: `${GAP}px` }}
            role="grid"
            aria-label="Watch activity heatmap, previous 12 months"
          >
            {columns.map((col, ci) => (
              <div key={ci} className="contents">
                {col.cells.map((cell, ri) =>
                  cell ? (
                    <button
                      key={ri}
                      type="button"
                      role="gridcell"
                      aria-label={cellLabel(cell)}
                      onMouseEnter={() => setActive(cell)}
                      onFocus={() => setActive(cell)}
                      onMouseLeave={() => setActive(null)}
                      style={{ width: cellSize, height: cellSize }}
                      className={`rounded-sm focus-ring ${LEVEL_COLORS[cell.activityScore]} hover:ring-1 hover:ring-ink-faint`}
                    />
                  ) : (
                    <div key={ri} style={{ width: cellSize, height: cellSize }} />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <p className="text-xs text-ink-muted min-h-[1.25rem]" aria-live="polite">
          {active ? cellLabel(active) : "Hover or focus a day to see details."}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
          <span>Less</span>
          {LEVEL_COLORS.map((c, i) => (
            <span key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
