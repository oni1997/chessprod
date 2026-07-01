"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { parseMoveTimes } from "@/lib/chess";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
  timeClass: string;
}

export default function MoveTimeDistribution({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const all: number[] = [];
    for (const g of games) {
      if (!g.pgn || g.timeClass === "daily") continue;
      const times = parseMoveTimes(g.pgn);
      all.push(...times);
    }
    if (all.length === 0) return [];

    const bounds = [0, 1000, 3000, 10000, 30000, 60000, 180000, 600000, Infinity];
    const labels = ["<1s", "1-3s", "3-10s", "10-30s", "30-60s", "1-3m", "3-10m", "10m+"];
    const counts = new Array(bounds.length - 1).fill(0);
    for (const t of all) {
      for (let i = 0; i < bounds.length - 1; i++) {
        if (t >= bounds[i] && t < bounds[i + 1]) {
          counts[i]++;
          break;
        }
      }
    }
    return labels.map((label, i) => ({ label, count: counts[i] })).filter((d) => d.count > 0);
  }, [games]);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Section>
      <SectionHeader title="Move Time Distribution" />
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Section>
  );
}
