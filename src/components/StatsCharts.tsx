"use client";

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

// A curated, desaturated palette. Variations on the app's ink-blue accent
// and warm neutrals, not a rainbow of saturated demo colors.
const PIE_COLORS = ["#284b68", "#a1442b", "#8fb2cf", "#7a6a45", "#4d7c9e", "#c48a5a", "#1f3a52", "#9c8c6a"];

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif";

const tooltipStyle = {
  backgroundColor: "#faf7ee",
  border: "1px solid #d9d0b8",
  borderRadius: 8,
  fontSize: 15,
  fontFamily: FONT_STACK,
  color: "#1c1a15",
};

const axisTick = { fontSize: 15, fontFamily: FONT_STACK, fill: "#4a4638" };
const legendStyle = { fontSize: 15, fontFamily: FONT_STACK, color: "#4a4638", paddingTop: 10 };

export function MonthlyActivityChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e6dfc9" vertical={false} />
        <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "#d9d0b8" }} tickLine={false} />
        <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ece4d1" }} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={12} />
        <Bar dataKey="episodes" name="Episodes" fill="#284b68" radius={[3, 3, 0, 0]} />
        <Bar dataKey="movies" name="Movies" fill="#8fb2cf" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GenrePieChart({ data }: { data: GenreSlice[] }) {
  if (data.length === 0) return <p className="text-sm text-ink-muted">Not enough data yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}
