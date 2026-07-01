"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { Section, SectionHeader } from "../section-header";

interface Game {
  ts: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  timeClass: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TimeOfDayPerformance({ games }: { games: Game[] }) {
  const byHour = useMemo(() => {
    const buckets: { total: number; wins: number }[] = Array.from({ length: 24 }, () => ({ total: 0, wins: 0 }));
    for (const g of games) {
      const h = new Date(g.ts * 1000).getHours();
      buckets[h].total++;
      if (g.result === "win") buckets[h].wins++;
    }
    return buckets.map((b, h) => ({
      hour: `${h}:00`,
      games: b.total,
      winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0,
    }));
  }, [games]);

  const byDay = useMemo(() => {
    const buckets: { total: number; wins: number }[] = Array.from({ length: 7 }, () => ({ total: 0, wins: 0 }));
    for (const g of games) {
      const d = new Date(g.ts * 1000).getDay();
      buckets[d].total++;
      if (g.result === "win") buckets[d].wins++;
    }
    return DAYS.map((day, i) => ({
      day,
      games: buckets[i].total,
      winRate: buckets[i].total > 0 ? Math.round((buckets[i].wins / buckets[i].total) * 100) : 0,
    }));
  }, [games]);

  const hasGames = byHour.some((b) => b.games > 0);

  if (!hasGames) return null;

  return (
    <div className="space-y-6">
      <Section>
        <SectionHeader title="Performance by Hour of Day" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="hour" tick={{ fill: "#a1a1aa", fontSize: 10 }} stroke="#52525b" interval={2} />
            <YAxis yAxisId="games" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
            />
            <Bar yAxisId="games" dataKey="games" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Games" />
            <Line yAxisId="rate" type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={2} dot={false} name="Win %" />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section>
        <SectionHeader title="Performance by Day of Week" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
            <YAxis yAxisId="games" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
            <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
            />
            <Bar yAxisId="games" dataKey="games" fill="#a855f7" radius={[2, 2, 0, 0]} name="Games" />
            <Line yAxisId="rate" type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={2} dot={false} name="Win %" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}
