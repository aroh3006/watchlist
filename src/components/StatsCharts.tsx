"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { MonthlyPoint, GenreSlice } from "@/lib/stats/dashboard";
import { getCurrentTheme, THEME_CHANGE_EVENT } from "@/lib/theme";

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif";

// Recharts takes literal color strings on its own props (fill, stroke,
// contentStyle, ...), it has no way to pick up CSS custom properties or
// Tailwind's dark: variant, so the two full palettes below are kept in sync
// by hand with the tokens in globals.css rather than computed from them.
const LIGHT = {
  // A curated, desaturated palette. Variations on the app's ink-blue accent
  // and warm neutrals, not a rainbow of saturated demo colors.
  pieColors: ["#284b68", "#a1442b", "#8fb2cf", "#7a6a45", "#4d7c9e", "#c48a5a", "#1f3a52", "#9c8c6a"],
  tooltipBg: "#faf7ee",
  tooltipBorder: "#d9d0b8",
  tooltipText: "#1c1a15",
  gridStroke: "#e6dfc9",
  axisLine: "#d9d0b8",
  axisTick: "#4a4638",
  legendText: "#4a4638",
  cursorFill: "#ece4d1",
  barEpisodes: "#284b68",
  barMovies: "#8fb2cf",
};

const DARK = {
  // Same idea, cool neutral-slate instead of warm, built around the app's
  // dark-mode muted-blue accent rather than the light theme's ink-blue.
  pieColors: ["#5c80b8", "#b5544a", "#9bb4d9", "#6fa8a0", "#3d62a0", "#c98a5e", "#2f4a80", "#8a8f98"],
  tooltipBg: "#1c1f23",
  tooltipBorder: "#2a2d32",
  tooltipText: "#e7e9ec",
  gridStroke: "#2a2d32",
  axisLine: "#2a2d32",
  axisTick: "#8a8f98",
  legendText: "#8a8f98",
  cursorFill: "#23262c",
  barEpisodes: "#3d62a0",
  barMovies: "#9bb4d9",
};

function useChartPalette() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    function sync() {
      setDark(getCurrentTheme() === "dark");
    }
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync);
  }, []);

  return dark ? DARK : LIGHT;
}

export function MonthlyActivityChart({ data }: { data: MonthlyPoint[] }) {
  const palette = useChartPalette();
  const tooltipStyle = {
    backgroundColor: palette.tooltipBg,
    border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: FONT_STACK,
    color: palette.tooltipText,
  };
  const axisTick = { fontSize: 15, fontFamily: FONT_STACK, fill: palette.axisTick };
  const legendStyle = { fontSize: 15, fontFamily: FONT_STACK, color: palette.legendText, paddingTop: 10 };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.gridStroke} vertical={false} />
        <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: palette.axisLine }} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: palette.cursorFill }} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={12} />
        <Bar dataKey="episodes" name="Episodes" fill={palette.barEpisodes} radius={[3, 3, 0, 0]} />
        <Bar dataKey="movies" name="Movies" fill={palette.barMovies} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GenrePieChart({ data }: { data: GenreSlice[] }) {
  const palette = useChartPalette();
  const tooltipStyle = {
    backgroundColor: palette.tooltipBg,
    border: `1px solid ${palette.tooltipBorder}`,
    borderRadius: 8,
    fontSize: 15,
    fontFamily: FONT_STACK,
    color: palette.tooltipText,
  };
  const legendStyle = { fontSize: 15, fontFamily: FONT_STACK, color: palette.legendText, paddingTop: 10 };

  if (data.length === 0) return <p className="text-sm text-ink-muted">Not enough data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={palette.pieColors[i % palette.pieColors.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}
