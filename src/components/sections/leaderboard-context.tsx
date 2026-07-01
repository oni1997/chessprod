"use client";

import { useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface RatingStat {
  format: string;
  rating: number;
  best: number;
  games: number;
}

interface FideInfo {
  fide?: number;
}

export default function LeaderboardContext({
  stats,
  fide,
}: {
  stats: RatingStat[];
  fide?: number;
}) {
  const percentiles = useMemo(() => {
    // Approximate percentile lookups based on known Chess.com distributions
    // These are rough estimates from public data
    const table: Record<string, [number, number][]> = {
      bullet: [[100, 1], [200, 3], [300, 7], [400, 12], [500, 20], [600, 30], [700, 40], [800, 50], [900, 58], [1000, 65], [1100, 72], [1200, 78], [1300, 83], [1400, 87], [1500, 91], [1600, 94], [1700, 96], [1800, 97.5], [1900, 98.5], [2000, 99.2], [2100, 99.6], [2200, 99.8], [2300, 99.9]],
      blitz: [[100, 1], [200, 2], [300, 5], [400, 10], [500, 17], [600, 25], [700, 35], [800, 45], [900, 54], [1000, 62], [1100, 70], [1200, 77], [1300, 82], [1400, 87], [1500, 91], [1600, 94], [1700, 96], [1800, 97.5], [1900, 98.5], [2000, 99.2], [2100, 99.6], [2200, 99.8]],
      rapid: [[100, 2], [200, 5], [300, 10], [400, 18], [500, 27], [600, 37], [700, 47], [800, 56], [900, 64], [1000, 72], [1100, 78], [1200, 83], [1300, 87], [1400, 91], [1500, 94], [1600, 96], [1700, 97.5], [1800, 98.5], [1900, 99.1], [2000, 99.5], [2100, 99.8]],
      daily: [[100, 2], [200, 5], [300, 10], [400, 18], [500, 28], [600, 38], [700, 48], [800, 57], [900, 65], [1000, 73], [1100, 79], [1200, 84], [1300, 88], [1400, 91], [1500, 94], [1600, 96], [1700, 97.5], [1800, 98.5], [1900, 99.2], [2000, 99.6]],
    };

    return stats.map((s) => {
      const rows = table[s.format];
      if (!rows) return { ...s, percentile: null, label: null };
      let pct = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (s.rating >= rows[i][0]) {
          pct = rows[i][1];
          break;
        }
      }
      const label = pct >= 99 ? "Top 1%" : pct >= 95 ? "Top 5%" : pct >= 90 ? "Top 10%" : pct >= 75 ? "Top 25%" : pct >= 50 ? "Top 50%" : null;
      return { ...s, percentile: pct, label };
    });
  }, [stats]);

  const hasAny = fide || percentiles.some((p) => p.label);

  if (!hasAny) return null;

  return (
    <Section>
      <SectionHeader title="Leaderboard Context" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fide && (
          <div className="text-center">
            <p className="text-ink-faint text-xs uppercase tracking-wider">FIDE</p>
            <p className="text-2xl font-bold">{fide}</p>
          </div>
        )}
        {percentiles.map(
          (p) =>
            p.label && (
              <div key={p.format} className="text-center">
                <p className="text-ink-faint text-xs uppercase tracking-wider">{p.format}</p>
                <p className="text-2xl font-bold">{p.rating}</p>
                <p className="text-result-win text-xs">{p.label}</p>
              </div>
            )
        )}
      </div>
      <p className="text-xs text-ink-faint mt-3 text-center">
        Approximate percentiles based on known Chess.com rating distributions.
      </p>
    </Section>
  );
}
