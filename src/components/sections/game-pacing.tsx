"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { parseMoveTimes } from "@/lib/chess";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
  timeClass: string;
}

const PHASES = [
  { label: "Moves 1-10", min: 1, max: 10 },
  { label: "Moves 11-20", min: 11, max: 20 },
  { label: "Moves 21-30", min: 21, max: 30 },
  { label: "Moves 31+", min: 31, max: Infinity },
];

export default function GamePacing({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const buckets = PHASES.map(() => ({ sum: 0, count: 0 }));

    for (const g of games) {
      if (!g.pgn || g.timeClass === "daily") continue;
      const times = parseMoveTimes(g.pgn);
      // Move i corresponds to move number (i+1)/2 rounded up
      for (let i = 0; i < times.length; i++) {
        const moveNum = Math.floor(i / 2) + 1;
        for (let b = 0; b < PHASES.length; b++) {
          if (moveNum >= PHASES[b].min && moveNum <= PHASES[b].max) {
            buckets[b].sum += times[i];
            buckets[b].count++;
            break;
          }
        }
      }
    }

    return PHASES.map((p, i) => ({
      phase: p.label,
      avg: buckets[i].count > 0 ? Math.round(buckets[i].sum / buckets[i].count / 1000) : 0, // seconds
      games: buckets[i].count,
    })).filter((d) => d.games > 0);
  }, [games]);

  if (data.length < 2) return null;

  return (
    <Section>
      <SectionHeader title="Game Pacing" subtitle="Excludes daily games. Clock values from PGN." />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="phase" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" unit="s" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Bar dataKey="avg" fill="#f97316" radius={[4, 4, 0, 0]} name="Avg seconds per move" />
        </BarChart>
      </ResponsiveContainer>
    </Section>
  );
}
