"use client";

import { useState, useMemo } from "react";
import { parsePGN } from "@/lib/chess";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
}

const TERM_EMOJI: Record<string, string> = {
  Normal: "🏁", Timeout: "⏱", Resigned: "🏳", Abandoned: "🚫",
  "Rules infraction": "⚠", "Time forfeit": "⏰",
};

function normalizeTermination(raw: string): string {
  const by = raw.match(/by\s+(.+)$/i);
  if (by) return by[1].charAt(0).toUpperCase() + by[1].slice(1);
  const on = raw.match(/on\s+(.+)$/i);
  if (on) return on[1].charAt(0).toUpperCase() + on[1].slice(1);
  const drawn = raw.match(/drawn\s+by\s+(.+)$/i);
  if (drawn) return drawn[1].charAt(0).toUpperCase() + drawn[1].slice(1);
  return raw;
}

export default function TerminationAnalysis({ games }: { games: Game[] }) {
  const [expanded, setExpanded] = useState(false);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of games) {
      if (!g.pgn) continue;
      const { termination } = parsePGN(g.pgn);
      if (!termination) continue;
      const key = normalizeTermination(termination);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [games]);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.count, 0);
  const show = expanded ? data : data.slice(0, 4);
  const hasMore = data.length > 4;

  return (
    <Section>
      <SectionHeader title="Game Termination" />
      <div className="space-y-3">
        {show.map((d) => (
          <div key={d.name}>
            <div className="flex justify-between text-sm mb-1">
              <span>
                {TERM_EMOJI[d.name] ?? "🎯"} {d.name}
              </span>
              <span className="text-ink-muted">
                {d.count} ({Math.round((d.count / total) * 100)}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-board-border overflow-hidden">
              <div
                className="h-full rounded-full bg-tc-daily transition-all"
                style={{ width: `${(d.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-brass hover:text-brass/80 transition-colors cursor-pointer"
        >
          {expanded
            ? `Show less (${data.length - 4} hidden)`
            : `Show all (${data.length} types, ${data.length - 4} more)`}
        </button>
      )}
    </Section>
  );
}
