"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Section, SectionHeader } from "../section-header";

interface RatingPoint {
  date: string;
  rating: number;
}

export default function RatingComparison({ username }: { username: string }) {
  const [opp, setOpp] = useState("");
  const [oppData, setOppData] = useState<RatingPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchOpp = async (name: string) => {
    setLoading(true);
    setError(false);
    try {
      const archRes = await fetch(`https://api.chess.com/pub/player/${name}/games/archives`);
      if (!archRes.ok) { setError(true); setLoading(false); return; }
      const archData = await archRes.json();
      const urls: string[] = (archData.archives ?? []).slice(-12);
      const points: RatingPoint[] = [];
      const lower = name.toLowerCase();

      for (const url of urls) {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        for (const g of (data.games ?? [])) {
          const ts = g.end_time ?? 0;
          if (!ts) continue;
          const isMe = (g.white?.username ?? "").toLowerCase() === lower;
          const rating = isMe ? g.white?.rating : g.black?.rating;
          if (rating) {
            points.push({ date: new Date(ts * 1000).toISOString(), rating });
          }
        }
      }

      const daily = new Map<string, number>();
      for (const p of points) {
        const day = p.date.slice(0, 10);
        daily.set(day, p.rating);
      }
      setOppData(
        Array.from(daily.entries())
          .map(([date, rating]) => ({ date, rating }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <Section>
      <SectionHeader title="Rating Comparison" />
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={opp}
          onChange={(e) => setOpp(e.target.value)}
          placeholder="Compare with another username"
          className="flex-1 px-4 py-2 rounded-xl bg-board-bg border border-board-border focus:outline-none focus:ring-2 focus:ring-brass text-white placeholder-ink-faint"
        />
        <button
          onClick={() => opp.trim() && fetchOpp(opp.trim())}
          disabled={loading || !opp.trim()}
          className="px-4 py-2 rounded-xl bg-tc-daily hover:bg-tc-daily font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "..." : "Compare"}
        </button>
      </div>
      {error && <p className="text-result-loss text-sm">Could not fetch data for that user.</p>}
      {oppData && (
        <div className="mt-2">
          <p className="text-ink-faint text-sm mb-3">Overlaying {opp}&apos;s rating on your chart</p>
          <p className="text-xs text-ink-faint">
            Scroll up to the Rating History by Time Control chart. The comparison data is loaded — a future version will merge them visually.
            For now, below is {opp}&apos;s rating trend:
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={oppData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
                tickFormatter={(v: string) => new Date(v).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                stroke="#52525b"
              />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#a1a1aa", fontSize: 12 }} stroke="#52525b" />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#f4f4f5" }}
              />
              <Line type="monotone" dataKey="rating" stroke="#f43f5e" strokeWidth={2} dot={false} name={opp} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Section>
  );
}
