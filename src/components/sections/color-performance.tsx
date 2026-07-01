"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
  result: "win" | "loss" | "draw";
}

const COLORS = { win: "#22c55e", loss: "#ef4444", draw: "#6b7280" };

export default function ColorPerformance({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const sides = { white: { win: 0, loss: 0, draw: 0 }, black: { win: 0, loss: 0, draw: 0 } };
    for (const g of games) {
      const isWhite = !g.pgn ? true : /^1\.\s/.test(g.pgn.replace(/\[.*?\]\s*/g, "").trim());
      const side = isWhite ? "white" : "black";
      sides[side][g.result]++;
    }
    return Object.entries(sides).map(([color, r]) => {
      const total = r.win + r.loss + r.draw;
      return {
        color,
        ...r,
        total,
        winRate: total > 0 ? Math.round((r.win / total) * 100) : 0,
      };
    });
  }, [games]);

  if (data.every((d) => d.total === 0)) return null;

  return (
    <Section>
      <SectionHeader title="Color Performance" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((d) => (
          <div key={d.color} className="text-center">
            <p className="text-ink-faint text-sm uppercase tracking-wider mb-2">
              Playing {d.color}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <p className="text-lg font-bold text-result-win">{d.win}</p>
                <p className="text-ink-faint text-xs">W</p>
              </div>
              <div>
                <p className="text-lg font-bold text-result-loss">{d.loss}</p>
                <p className="text-ink-faint text-xs">L</p>
              </div>
              <div>
                <p className="text-lg font-bold text-result-draw">{d.draw}</p>
                <p className="text-ink-faint text-xs">D</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: d.winRate >= 50 ? "#22c55e" : "#ef4444" }}>
              {d.winRate}% win rate
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
