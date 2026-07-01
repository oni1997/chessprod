"use client";

import { useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  opponent: string;
  result: "win" | "loss" | "draw";
}

export default function CommonOpponents({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { total: number; wins: number; losses: number; draws: number }>();
    for (const g of games) {
      if (!g.opponent) continue;
      const entry = map.get(g.opponent) ?? { total: 0, wins: 0, losses: 0, draws: 0 };
      entry.total++;
      if (g.result === "win") entry.wins++;
      else if (g.result === "loss") entry.losses++;
      else entry.draws++;
      map.set(g.opponent, entry);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        opponent: name,
        ...v,
        winRate: v.total > 0 ? Math.round((v.wins / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [games]);

  if (data.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Common Opponents" subtitle="Top 20" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-ink-faint border-b border-board-border">
            <th className="text-left py-2 pr-3">Opponent</th>
            <th className="text-right py-2 pr-3">Games</th>
            <th className="text-right py-2 pr-3">W</th>
            <th className="text-right py-2 pr-3">L</th>
            <th className="text-right py-2">Win %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-board-border/50">
              <td className="py-2 pr-3 font-mono">{d.opponent}</td>
              <td className="py-2 pr-3 text-right text-ink-muted">{d.total}</td>
              <td className="py-2 pr-3 text-right text-result-win">{d.wins}</td>
              <td className="py-2 pr-3 text-right text-result-loss">{d.losses}</td>
              <td className="py-2 text-right font-medium" style={{ color: d.winRate >= 50 ? "#22c55e" : "#ef4444" }}>
                {d.winRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
