"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader } from "../section-header";
import { parsePGN } from "@/lib/chess";

interface Game {
  pgn: string;
  timeClass: string;
  result: "win" | "loss" | "draw";
}

export default function TimeAnalysis({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const tcMap = new Map<string, number[]>();
    for (const g of games) {
      if (!g.pgn) continue;
      const { moveCount } = parsePGN(g.pgn);
      if (moveCount < 2) continue;
      const tc = g.timeClass === "unknown" ? "other" : g.timeClass;
      if (!tcMap.has(tc)) tcMap.set(tc, []);
      tcMap.get(tc)!.push(moveCount);
    }
    return Array.from(tcMap.entries())
      .map(([tc, counts]) => {
        const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
        const sorted = [...counts].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        return { timeClass: tc, avgMoves: Math.round(avg * 10) / 10, medianMoves: median, games: counts.length };
      })
      .sort((a, b) => b.games - a.games);
  }, [games]);

  if (data.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Game Length by Time Control" />
      <ResponsiveContainer width="100%" height={data.length * 70 + 40}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis type="category" dataKey="timeClass" tick={{ fill: "#a1a1aa", fontSize: 12 }} tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)} stroke="#52525b" width={80} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Bar dataKey="avgMoves" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg Moves" />
          <Bar dataKey="medianMoves" fill="#a855f7" radius={[0, 4, 4, 0]} name="Median Moves" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 text-sm text-ink-faint justify-center">
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-tc-daily" /> Avg Moves</span>
        <span className="flex items-center gap-1"><span className="size-3 rounded-sm bg-ink-faint" /> Median Moves</span>
      </div>
    </Section>
  );
}
