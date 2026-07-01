"use client";

import { useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  date: Date;
  myRating: number;
  timeClass: string;
}

export default function PersonalBests({ games }: { games: Game[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { rating: number; date: Date }>();
    const dailyMap = new Map<string, { rating: number; date: Date }>();

    for (const g of games) {
      if (g.timeClass === "daily") {
        const key = g.date.toISOString().slice(0, 10);
        if (!dailyMap.has(key) || g.myRating > dailyMap.get(key)!.rating) {
          dailyMap.set(key, { rating: g.myRating, date: g.date });
        }
        continue;
      }
      const key = g.date.toISOString().slice(0, 10);
      if (!map.has(key) || g.myRating > map.get(key)!.rating) {
        map.set(key, { rating: g.myRating, date: g.date });
      }
    }

    const allPeaks = Array.from(map.values()).concat(Array.from(dailyMap.values()));
    const sorted = allPeaks.sort((a, b) => b.rating - a.rating);
    const seen = new Set<number>();
    const milestones: { rating: number; date: Date; label: string }[] = [];

    for (const p of sorted) {
      const bucket = Math.floor(p.rating / 25) * 25;
      const key = bucket;
      if (!seen.has(key)) {
        seen.add(key);
        milestones.push({
          rating: p.rating,
          date: p.date,
          label: `Reached ${p.rating}`,
        });
      }
    }

    return milestones.sort((a, b) => b.rating - a.rating).slice(0, 15);
  }, [games]);

  if (data.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Personal Best Milestones" />
      <div className="space-y-2">
        {data.map((m, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className="text-brass text-lg">{i === 0 ? "🏆" : "⭐"}</span>
            <span className="font-medium text-ink-primary">{m.rating}</span>
            <span className="text-ink-faint">
              {m.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-board-border overflow-hidden">
              <div
                className="h-full rounded-full bg-brass"
                style={{ width: `${Math.min(100, (m.rating / (data[0]?.rating ?? m.rating)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
