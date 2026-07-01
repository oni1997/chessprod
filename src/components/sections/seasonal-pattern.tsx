"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader } from "../section-header";

interface Game {
  date: Date;
  myRating: number;
  timeClass: string;
}

export default function SeasonalPattern({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const buckets: { sum: number; count: number }[] = months.map(() => ({ sum: 0, count: 0 }));

    for (const g of games) {
      if (g.timeClass === "daily") continue;
      const m = g.date.getMonth();
      buckets[m].sum += g.myRating;
      buckets[m].count++;
    }

    return months.map((name, i) => {
      const b = buckets[i];
      const avg = b.count > 0 ? Math.round(b.sum / b.count) : null;
      return { month: name, avgRating: avg, games: b.count };
    });
  }, [games]);

  const hasData = data.some((d) => d.avgRating !== null);
  if (!hasData) return null;

  return (
    <Section>
      <SectionHeader title="Seasonal Pattern" subtitle="Avg rating by month" />
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="month" tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
          />
          <Line type="monotone" dataKey="avgRating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="Avg Rating" />
        </LineChart>
      </ResponsiveContainer>
    </Section>
  );
}
