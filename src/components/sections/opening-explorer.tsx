"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader } from "../section-header";
import { parsePGN } from "@/lib/chess";

interface Game {
  pgn: string;
  result: "win" | "loss" | "draw";
}

export default function OpeningExplorer({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { total: number; wins: number; draws: number; losses: number }>();
    for (const g of games) {
      const { opening } = parsePGN(g.pgn);
      if (!opening || opening === "Unknown") continue;
      const entry = map.get(opening) ?? { total: 0, wins: 0, draws: 0, losses: 0 };
      entry.total++;
      if (g.result === "win") entry.wins++;
      else if (g.result === "draw") entry.draws++;
      else entry.losses++;
      map.set(opening, entry);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        opening: name,
        ...v,
        winRate: Math.round((v.wins / v.total) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [games]);

  if (data.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Opening Explorer" subtitle="Top 15" />
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis type="category" dataKey="opening" tick={{ fill: "#a1a1aa", fontSize: 11 }} stroke="#52525b" width={120} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Bar dataKey="wins" stackId="a" fill="#22c55e" name="Wins" />
          <Bar dataKey="draws" stackId="a" fill="#6b7280" name="Draws" />
          <Bar dataKey="losses" stackId="a" fill="#ef4444" name="Losses" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((d) => (
          <div key={d.opening} className="flex items-center gap-3 text-sm">
            <span className="flex-1 text-ink-primary truncate font-mono">{d.opening}</span>
            <span className="text-ink-faint w-16 text-right">{d.total} games</span>
            <span className={`w-12 text-right font-medium ${d.winRate >= 50 ? "text-result-win" : "text-result-loss"}`}>
              {d.winRate}%
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
