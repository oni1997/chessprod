"use client";

import { useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  ts: number;
  myRating: number;
  result: "win" | "loss" | "draw";
}

export default function SessionAnalysis({ games }: { games: Game[] }) {
  const sessions = useMemo(() => {
    const sorted = [...games].sort((a, b) => a.ts - b.ts);
    if (sorted.length === 0) return [];

    const groups: { games: typeof sorted; start: number }[] = [];
    let current = { games: [sorted[0]], start: sorted[0].ts };

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].ts - current.start < 7200) {
        current.games.push(sorted[i]);
      } else {
        groups.push(current);
        current = { games: [sorted[i]], start: sorted[i].ts };
      }
    }
    groups.push(current);

    return groups
      .map((s) => {
        const ratings = s.games.map((g) => g.myRating);
        const first = ratings[0];
        const last = ratings[ratings.length - 1];
        const wins = s.games.filter((g) => g.result === "win").length;
        const losses = s.games.filter((g) => g.result === "loss").length;
        return {
          date: new Date(s.start * 1000).toISOString().slice(0, 10),
          gameCount: s.games.length,
          ratingChange: last - first,
          wins,
          losses,
        };
      })
      .filter((s) => s.gameCount >= 3)
      .sort((a, b) => b.ratingChange - a.ratingChange)
      .slice(0, 20);
  }, [games]);

  if (sessions.length === 0) return null;

  const totalSessions = sessions.length;
  const avgChange = Math.round(sessions.reduce((s, x) => s + x.ratingChange, 0) / totalSessions);
  const bestSession = [...sessions].sort((a, b) => b.ratingChange - a.ratingChange)[0];

  return (
    <Section>
      <SectionHeader title="Session Analysis" subtitle="3+ games in 2-hour window" />
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="text-ink-faint text-xs uppercase tracking-wider">Sessions</p>
          <p className="text-2xl font-bold">{totalSessions}</p>
        </div>
        <div>
          <p className="text-ink-faint text-xs uppercase tracking-wider">Avg Δ Rating</p>
          <p className={`text-2xl font-bold ${avgChange >= 0 ? "text-result-win" : "text-result-loss"}`}>
            {avgChange >= 0 ? "+" : ""}{avgChange}
          </p>
        </div>
        <div>
          <p className="text-ink-faint text-xs uppercase tracking-wider">Best Session</p>
          <p className="text-2xl font-bold text-result-win">+{bestSession.ratingChange}</p>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-ink-faint border-b border-board-border">
            <th className="text-left py-1 pr-3">Date</th>
            <th className="text-right py-1 pr-3">Games</th>
            <th className="text-right py-1 pr-3">W</th>
            <th className="text-right py-1 pr-3">L</th>
            <th className="text-right py-1">Δ</th>
          </tr>
        </thead>
        <tbody>
          {sessions.slice(0, 10).map((s, i) => (
            <tr key={i} className="border-b border-board-border/50">
              <td className="py-1 pr-3 text-ink-muted font-mono">{s.date}</td>
              <td className="py-1 pr-3 text-right font-mono">{s.gameCount}</td>
              <td className="py-1 pr-3 text-right text-result-win">{s.wins}</td>
              <td className="py-1 pr-3 text-right text-result-loss">{s.losses}</td>
              <td className={`py-1 text-right font-medium ${s.ratingChange > 0 ? "text-result-win" : s.ratingChange < 0 ? "text-result-loss" : ""}`}>
                {s.ratingChange > 0 ? "+" : ""}{s.ratingChange}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
