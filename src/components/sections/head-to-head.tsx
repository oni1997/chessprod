"use client";

import { useState, useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  opponent: string;
  result: "win" | "loss" | "draw";
  myRating: number;
  opponentRating: number;
  date: Date;
}

export default function HeadToHead({ games }: { games: Game[] }) {
  const [opp, setOpp] = useState("");

  const filtered = useMemo(() => {
    if (!opp.trim()) return null;
    const lower = opp.trim().toLowerCase();
    const matches = games.filter((g) => g.opponent.toLowerCase() === lower);
    if (matches.length === 0) return null;

    const results = { win: 0, loss: 0, draw: 0 };
    for (const g of matches) results[g.result]++;

    const sorted = [...matches].sort((a, b) => b.date.getTime() - a.date.getTime());
    return { results, total: matches.length, games: sorted };
  }, [games, opp]);

  return (
    <Section>
      <SectionHeader title="Head-to-Head" />
      <input
        type="text"
        value={opp}
        onChange={(e) => setOpp(e.target.value)}
        placeholder="Enter opponent username"
        className="w-full px-4 py-2 rounded-xl bg-board-bg border border-board-border focus:outline-none focus:ring-2 focus:ring-brass text-white placeholder-ink-faint mb-4"
      />
      {filtered ? (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div><p className="text-2xl font-bold text-result-win">{filtered.results.win}</p><p className="text-ink-faint text-sm">Wins</p></div>
            <div><p className="text-2xl font-bold text-result-loss">{filtered.results.loss}</p><p className="text-ink-faint text-sm">Losses</p></div>
            <div><p className="text-2xl font-bold text-result-draw">{filtered.results.draw}</p><p className="text-ink-faint text-sm">Draws</p></div>
          </div>
          <p className="text-ink-faint text-sm mb-3">{filtered.total} games vs {opp.trim()}</p>
          {filtered.games.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-faint border-b border-board-border">
                  <th className="text-left py-1 pr-3">Date</th>
                  <th className="text-right py-1 pr-3">My</th>
                  <th className="text-right py-1 pr-3">Opp</th>
                  <th className="text-right py-1">Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.games.slice(0, 20).map((g, i) => (
                  <tr key={i} className="border-b border-board-border/50">
                    <td className="py-1 pr-3 text-ink-muted font-mono">{g.date.toLocaleDateString()}</td>
                    <td className="py-1 pr-3 text-right font-mono">{g.myRating}</td>
                    <td className="py-1 pr-3 text-right font-mono">{g.opponentRating}</td>
                    <td className="py-1 text-right">
                      <span className={g.result === "win" ? "text-result-win" : g.result === "loss" ? "text-result-loss" : "text-ink-muted"}>
                        {g.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : opp.trim() ? (
        <p className="text-ink-faint text-sm">No games found against this player.</p>
      ) : (
        <p className="text-ink-faint text-sm">Type an opponent name to see your record.</p>
      )}
    </Section>
  );
}
