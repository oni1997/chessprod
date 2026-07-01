"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Section, SectionHeader } from "../section-header";

interface Game {
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  timeClass: string;
}

const DELTA_BUCKETS = [
  { label: "< -200", min: -Infinity, max: -200 },
  { label: "-200", min: -200, max: -100 },
  { label: "-100", min: -100, max: 0 },
  { label: "0", min: 0, max: 100 },
  { label: "+100", min: 100, max: 200 },
  { label: "+200+", min: 200, max: Infinity },
];

export default function PerformanceVsDelta({ games }: { games: Game[] }) {
  const [format, setFormat] = useState("all");

  const data = useMemo(() => {
    const bucketMap = DELTA_BUCKETS.map((b) => ({
      ...b,
      wins: 0,
      losses: 0,
      draws: 0,
      total: 0,
    }));

    const filtered = format === "all" ? games : games.filter((g) => g.timeClass === format);

    for (const g of filtered) {
      const diff = g.opponentRating - g.myRating;
      for (const b of bucketMap) {
        if (diff >= b.min && diff < b.max) {
          b.total++;
          if (g.result === "win") b.wins++;
          else if (g.result === "loss") b.losses++;
          else b.draws++;
          break;
        }
      }
    }

    return bucketMap
      .filter((b) => b.total > 0)
      .map((b) => ({
        range: `${b.label}`,
        total: b.total,
        wins: b.wins,
        losses: b.losses,
        draws: b.draws,
        winRate: Math.round((b.wins / b.total) * 100),
      }));
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
        title="Performance vs Rating Delta"
        subtitle="Win/Loss/Draw when opponent is rated lower (&minus;) or higher (+) than you"
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
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="range" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Bar dataKey="wins" stackId="a" fill="#22c55e" name="Wins" />
          <Bar dataKey="draws" stackId="a" fill="#6b7280" name="Draws" />
          <Bar dataKey="losses" stackId="a" fill="#ef4444" name="Losses" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 text-xs text-ink-faint justify-center">
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-result-win" /> Win</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-ink-faint" /> Draw</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-result-loss" /> Loss</span>
      </div>
    </Section>
  );
}
