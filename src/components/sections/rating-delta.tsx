"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Section, SectionHeader } from "../section-header";

interface Game {
  date: Date;
  myRating: number;
  timeClass: string;
}

export default function RatingDeltaTimeline({ games }: { games: Game[] }) {
  const [format, setFormat] = useState("all");

  const data = useMemo(() => {
    const map = new Map<string, { rating: number; date: string }>();
    for (const g of games) {
      if (format !== "all" && g.timeClass !== format) continue;
      const key = g.date.toISOString().slice(0, 10);
      if (!map.has(key) || g.date > new Date(map.get(key)!.date)) {
        map.set(key, { rating: g.myRating, date: g.date.toISOString() });
      }
    }
    const sorted = Array.from(map.entries())
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return sorted
      .map((d, i, arr) => ({
        day: d.day.slice(5), // MM-DD
        delta: i === 0 ? 0 : d.rating - arr[i - 1].rating,
        rating: d.rating,
        fullDate: d.day,
      }))
      .filter((d) => d.delta !== 0)
      .slice(-60);
  }, [games, format]);

  const formats = useMemo(() => {
    const s = new Set<string>();
    games.forEach((g) => s.add(g.timeClass));
    return ["all", ...Array.from(s).filter((f) => f !== "unknown")];
  }, [games]);

  if (data.length < 2) return null;

  return (
    <Section>
      <SectionHeader
        title="Rating Delta Timeline"
        action={
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="bg-board-surface border border-board-border rounded-chip px-3 py-1 text-sm text-ink-muted focus:outline-none cursor-pointer"
          >
            {formats.map((f) => (
              <option key={f} value={f} className="capitalize">{f === "all" ? "All" : f}</option>
            ))}
          </select>
        }
      />
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 10 }} stroke="#52525b" interval={4} />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
            labelFormatter={(v) => `Date: ${v}`}
          />
          <Bar dataKey="delta" radius={[2, 2, 0, 0]} strokeWidth={0}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.delta >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-ink-faint justify-center">
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-result-win" /> Gain</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-result-loss" /> Loss</span>
      </div>
    </Section>
  );
}
