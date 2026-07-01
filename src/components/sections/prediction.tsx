"use client";

import { useMemo } from "react";
import { linearRegression } from "@/lib/chess";
import { Section, SectionHeader } from "../section-header";

interface RatingPoint {
  date: string;
  rating: number;
}

export default function Prediction({ history }: { history: RatingPoint[] }) {
  const pred = useMemo(() => {
    const unique: RatingPoint[] = [];
    const seen = new Set<string>();
    for (const p of history) {
      const key = p.date.slice(0, 10);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }
    if (unique.length < 5) return null;

    const sorted = [...unique].sort((a, b) => a.date.localeCompare(b.date));
    const points = sorted.map((p, i) => ({ x: i, y: p.rating }));
    const reg = linearRegression(points);
    if (reg.r2 < 0.01) return null;

    const lastRating = sorted[sorted.length - 1].rating;
    const currentX = points.length - 1;

    const nextHundred = Math.ceil(lastRating / 100) * 100;
    const prevHundred = Math.floor(lastRating / 100) * 100;

    const daysToNext = reg.slope > 0
      ? (nextHundred - lastRating) / reg.slope
      : null;
    const daysToPrev = reg.slope < 0
      ? (lastRating - prevHundred) / Math.abs(reg.slope)
      : null;

    const trend30 = Math.round(reg.slope * 30);
    const finalRating = reg.slope * currentX + reg.intercept;

    return {
      slope: reg.slope,
      r2: reg.r2,
      lastRating,
      trend30,
      nextHundred: reg.slope > 0 ? nextHundred : null,
      daysToNext,
      prevHundred: reg.slope < 0 ? prevHundred : null,
      daysToPrev,
      finalRating: Math.round(finalRating),
    };
  }, [history]);

  if (!pred) return null;

  const fmt = (d: number | null) => d != null ? `${Math.round(d)} days` : "—";

  return (
    <Section>
      <SectionHeader title="Rating Prediction" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-ink-faint text-xs uppercase tracking-wider">Trend (30d)</p>
          <p className={`text-xl font-bold ${pred.trend30 >= 0 ? "text-result-win" : "text-result-loss"}`}>
            {pred.trend30 >= 0 ? "+" : ""}{pred.trend30}
          </p>
        </div>
        <div>
          <p className="text-ink-faint text-xs uppercase tracking-wider">R² Fit</p>
          <p className="text-xl font-bold">{pred.r2.toFixed(2)}</p>
        </div>
        {pred.nextHundred && (
          <div>
            <p className="text-ink-faint text-xs uppercase tracking-wider">Next {pred.nextHundred}</p>
            <p className="text-xl font-bold text-result-win">{fmt(pred.daysToNext)}</p>
          </div>
        )}
        {pred.prevHundred && (
          <div>
            <p className="text-ink-faint text-xs uppercase tracking-wider">Risk {pred.prevHundred}</p>
            <p className="text-xl font-bold text-result-loss">{fmt(pred.daysToPrev)}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-ink-faint mt-3 text-center">
        Based on simple linear regression of unique rating days. R² close to 1 = strong trend.
      </p>
    </Section>
  );
}
