"use client";

import { useMemo, useState } from "react";
import type { HeatmapCell } from "@/lib/stats/heatmap";

const LEVEL_COLORS = ["bg-activity-0", "bg-activity-1", "bg-activity-2", "bg-activity-3", "bg-activity-4"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function cellLabel(cell: HeatmapCell): string {
  const date = new Date(cell.date + "T00:00:00Z");
  const dateStr = date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
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
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-1 ml-8 mb-1 relative h-4">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute text-[11px] text-ink-faint"
                style={{ left: `${m.colIndex * 14}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 mr-1 w-7 shrink-0">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i} className="h-3 text-[10px] text-ink-faint leading-3">
                  {label}
                </span>
              ))}
            </div>
            <div
              className="grid grid-flow-col gap-1"
              style={{ gridTemplateRows: "repeat(7, 0.75rem)" }}
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
                        className={`w-3 h-3 rounded-sm focus-ring ${LEVEL_COLORS[cell.activityScore]} hover:ring-1 hover:ring-ink-faint`}
                      />
                    ) : (
                      <div key={ri} className="w-3 h-3" />
                    )
                  )}
                </div>
              ))}
            </div>
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
