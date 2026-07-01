"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { PlayerData } from "@/lib/chess";
import Hero, { type HeroProps } from "./hero";
import { Section, SectionHeader } from "./section-header";

// Existing sections
import OpeningExplorer from "@/components/sections/opening-explorer";
import TimeAnalysis from "@/components/sections/time-analysis";
import Prediction from "@/components/sections/prediction";
import HeadToHead from "@/components/sections/head-to-head";
import ExportCSV from "@/components/sections/export-csv";
import SeasonalPattern from "@/components/sections/seasonal-pattern";
import LeaderboardContext from "@/components/sections/leaderboard-context";
import OpponentCountries from "@/components/sections/opponent-countries";

// New sections
import ColorPerformance from "@/components/sections/color-performance";
import TerminationAnalysis from "@/components/sections/termination-analysis";
import CommonOpponents from "@/components/sections/common-opponents";
import TrophiesClubs from "@/components/sections/trophies-clubs";
import Tournaments from "@/components/sections/tournaments";
import SessionAnalysis from "@/components/sections/session-analysis";
import MoveTimeDistribution from "@/components/sections/move-times";
import TimeOfDayPerformance from "@/components/sections/time-of-day";
import RatingComparison from "@/components/sections/rating-comparison";
import PGNDownload from "@/components/sections/pgn-download";
import RatingDeltaTimeline from "@/components/sections/rating-delta";
import PerformanceVsDelta from "@/components/sections/performance-vs-delta";
import GamePacing from "@/components/sections/game-pacing";
import PersonalBests from "@/components/sections/personal-bests";
import BoardReplayer from "@/components/sections/board-replayer";

type View = "loading" | "error" | "empty" | "data";

interface EnrichedGame {
  date: Date;
  ts: number;
  opponent: string;
  opponentRating: number;
  myRating: number;
  result: "win" | "loss" | "draw";
  timeClass: string;
  pgn: string;
}

const TC_COLORS: Record<string, string> = {
  bullet: "#a855f7", blitz: "#f97316", rapid: "#22c55e", daily: "#3b82f6",
};

const RESULT_COLORS = ["#22c55e", "#ef4444", "#6b7280"];

function buildStreaks(games: EnrichedGame[]) {
  const sorted = [...games].sort((a, b) => a.ts - b.ts);
  let currentResult = "";
  let currentCount = 0;
  let bestWin = 0;
  let bestLoss = 0;
  for (const g of sorted) {
    if (g.result === currentResult) {
      currentCount++;
    } else {
      if (currentResult === "win") bestWin = Math.max(bestWin, currentCount);
      if (currentResult === "loss") bestLoss = Math.max(bestLoss, currentCount);
      currentResult = g.result;
      currentCount = 1;
    }
  }
  if (currentResult === "win") bestWin = Math.max(bestWin, currentCount);
  if (currentResult === "loss") bestLoss = Math.max(bestLoss, currentCount);
  const last20 = sorted.slice(-20).reverse();
  return { last20, bestWin, bestLoss, currentResult, currentCount };
}

export default function Dashboard({ username }: { username: string }) {
  const [view, setView] = useState<View>("loading");
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<PlayerData["stats"]>([]);
  const [games, setGames] = useState<EnrichedGame[]>([]);

  const fetchData = useCallback(async () => {
    setView("loading");
    try {
      const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);
      if (!profileRes.ok) { setView("error"); return; }
      const profileData = await profileRes.json();

      const [statsRes, archRes] = await Promise.all([
        fetch(`https://api.chess.com/pub/player/${username}/stats`),
        fetch(`https://api.chess.com/pub/player/${username}/games/archives`),
      ]);

      const statsData = statsRes.ok ? await statsRes.json() : null;
      const archData = archRes.ok ? await archRes.json() : null;
      const archives: string[] = archData?.archives ?? [];

      const s: PlayerData["stats"] = [];
      if (statsData) {
        for (const tc of ["chess_bullet", "chess_blitz", "chess_rapid", "chess_daily"] as const) {
          const d = statsData[tc];
          if (d?.last?.rating) {
            s.push({
              format: tc.replace("chess_", ""),
              rating: d.last.rating,
              best: d.best?.rating ?? d.last.rating,
              games: (d.record?.win ?? 0) + (d.record?.loss ?? 0) + (d.record?.draw ?? 0),
            });
          }
        }
      }

      const recentUrls = archives.slice(-12);
      const allGames: EnrichedGame[] = [];
      const playerLower = username.toLowerCase();
      const resultsMap: Record<string, "win" | "loss" | "draw"> = {
        win: "win", loss: "loss", checkmated: "loss", resigned: "loss",
        timeout: "draw", abandoned: "draw", agreed: "draw", stalemate: "draw",
        insufficient: "draw", threefold: "draw", repetition: "draw",
        timevsinsufficient: "draw", pat: "draw",
      };

      for (const url of recentUrls) {
        const r = await fetch(url);
        if (!r.ok) continue;
        const data = await r.json();
        for (const g of (data.games ?? [])) {
          const ts = g.end_time ?? 0;
          if (!ts) continue;
          const isMe = (g.white?.username ?? "").toLowerCase() === playerLower;
          const me = isMe ? g.white : g.black;
          const opp = isMe ? g.black : g.white;
          const oppRating = opp?.rating ?? 0;
          const myRating = me?.rating ?? 0;
          if (!myRating) continue;
          const rawResult = (me?.result ?? "").toLowerCase();
          const result = resultsMap[rawResult] ?? "draw";
          allGames.push({
            date: new Date(ts * 1000),
            ts,
            opponent: opp?.username ?? "",
            opponentRating: oppRating,
            myRating,
            result,
            timeClass: g.time_class ?? "unknown",
            pgn: g.pgn ?? "",
          });
        }
      }

      setProfile(profileData);
      setStats(s);
      setGames(allGames);
      setView("data");
    } catch {
      setView("error");
    }
  }, [username]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Derived data ----

  const ratingByTC = useMemo(() => {
    const map: Record<string, { date: string; rating: number }[]> = {};
    const formats = ["bullet", "blitz", "rapid", "daily"];
    for (const f of formats) map[f] = [];
    for (const g of games) {
      if (!formats.includes(g.timeClass)) continue;
      map[g.timeClass].push({ date: g.date.toISOString(), rating: g.myRating });
    }
    for (const f of formats) {
      const daily = new Map<string, number>();
      for (const p of map[f]) {
        const day = p.date.slice(0, 10);
        daily.set(day, p.rating);
      }
      map[f] = Array.from(daily.entries())
        .map(([date, rating]) => ({ date, rating }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
  }, [games]);

  const allFormats = useMemo(
    () => Object.keys(ratingByTC).filter((f) => ratingByTC[f].length > 1),
    [ratingByTC]
  );

  const averageRatingOverTime = useMemo(() => {
    const dateMap = new Map<string, number[]>();
    for (const fmt of allFormats) {
      for (const pt of ratingByTC[fmt]) {
        if (!dateMap.has(pt.date)) dateMap.set(pt.date, []);
        dateMap.get(pt.date)!.push(pt.rating);
      }
    }
    return Array.from(dateMap.entries())
      .map(([date, ratings]) => ({
        date,
        rating: Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allFormats, ratingByTC]);

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 0; i < 84; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const g of games) {
      const key = g.date.toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, map.get(key)! + 1);
    }
    return map;
  }, [games]);

  const heatmapDays = useMemo(() => {
    const now = new Date();
    const days: { date: Date; count: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d, count: activityMap.get(d.toISOString().slice(0, 10)) ?? 0 });
    }
    return days;
  }, [activityMap]);

  const maxActivity = useMemo(
    () => Math.max(...heatmapDays.map((d) => d.count), 1),
    [heatmapDays]
  );

  const resultsByTC = useMemo(() => {
    const map: Record<string, { win: number; loss: number; draw: number }> = {};
    for (const g of games) {
      if (!map[g.timeClass]) map[g.timeClass] = { win: 0, loss: 0, draw: 0 };
      map[g.timeClass][g.result]++;
    }
    return map;
  }, [games]);

  const streaks = useMemo(() => buildStreaks(games), [games]);

  const oppDist = useMemo(() => {
    const step = 100;
    const buckets: { range: string; total: number; wins: number }[] = [];
    for (let r = 0; r <= 2500; r += step) {
      buckets.push({ range: r === 0 ? `<${r + step}` : `${r}-${r + step}`, total: 0, wins: 0 });
    }
    for (const g of games) {
      if (!g.opponentRating) continue;
      const idx = Math.min(Math.floor(g.opponentRating / step), buckets.length - 1);
      buckets[idx].total++;
      if (g.result === "win") buckets[idx].wins++;
    }
    return buckets
      .filter((b) => b.total > 0)
      .map((b) => ({ ...b, winRate: b.total > 0 ? Math.round((b.wins / b.total) * 100) : 0 }));
  }, [games]);

  const bestWins = useMemo(
    () =>
      games
        .filter((g) => g.result === "win" && g.opponentRating > 0 && g.opponentRating > g.myRating + 99)
        .sort((a, b) => (b.opponentRating - b.myRating) - (a.opponentRating - a.myRating))
        .slice(0, 20),
    [games]
  );

  const totalResults = useMemo(() => {
    const r = { win: 0, loss: 0, draw: 0 };
    for (const g of games) r[g.result]++;
    return r;
  }, [games]);

  // Reformat for sections
  const gamesForSections = useMemo(
    () =>
      games.map((g) => ({
        date: g.date.toISOString(),
        opponent: g.opponent,
        myRating: g.myRating,
        opponentRating: g.opponentRating,
        result: g.result,
        timeClass: g.timeClass,
        pgn: g.pgn,
      })),
    [games]
  );

  const h2hGames = useMemo(
    () =>
      games.map((g) => ({
        opponent: g.opponent,
        result: g.result,
        myRating: g.myRating,
        opponentRating: g.opponentRating,
        date: g.date,
      })),
    [games]
  );

  // ---- Render ----

  if (view === "loading") {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin size-10 border-4 border-brass border-t-transparent rounded-full" />
      </div>
    );
  }

  if (view === "error") {
    return (
      <div className="text-center py-16">
        <p className="text-result-loss text-lg">Player not found.</p>
        <p className="text-result-draw mt-1">Check the spelling and try again.</p>
      </div>
    );
  }

  if (!profile) return null;

  const p = profile as any;
  const totalG = totalResults.win + totalResults.loss + totalResults.draw;
  const resultPie = [
    { name: "Wins", value: totalResults.win },
    { name: "Losses", value: totalResults.loss },
    { name: "Draws", value: totalResults.draw },
  ].filter((d) => d.value > 0);

  const ratingsObj: HeroProps["ratings"] = { bullet: null, blitz: null, rapid: null, daily: null };
  for (const s of stats) {
    const f = s.format as keyof typeof ratingsObj;
    if (f in ratingsObj) ratingsObj[f] = { rating: s.rating, best: s.best, games: s.games };
  }
  const primaryFormat =
    (["bullet", "blitz", "rapid", "daily"] as const)
      .filter((f) => ratingsObj[f])
      .sort((a, b) => (ratingsObj[b]?.rating ?? 0) - (ratingsObj[a]?.rating ?? 0))[0] ?? "blitz";

  return (
    <div className="space-y-8">
      <Hero
        username={p.username}
        displayName={p.name ?? p.username}
        avatarUrl={p.avatar}
        location={p.location}
        memberSince={
          p.joined
            ? new Date(p.joined * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long" })
            : "N/A"
        }
        lastOnline={
          p.last_online
            ? new Date(p.last_online * 1000).toLocaleString("en-US", {
                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : "N/A"
        }
        ratings={ratingsObj}
        primaryFormat={primaryFormat}
      />

      {/* Prediction + Leaderboard */}
      <Prediction history={games.map((g) => ({ date: g.date.toISOString(), rating: g.myRating }))} />
      <LeaderboardContext stats={stats} fide={p.fide} />

      {/* Rating history by time control — individual charts */}
      {allFormats.map((fmt) => (
        <Section key={fmt}>
          <SectionHeader
            title={`${fmt.charAt(0).toUpperCase() + fmt.slice(1)} Rating Over Time`}
            subtitle={`How your ${fmt} rating has changed — each dot is a day you played`}
          />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ratingByTC[fmt]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--board-border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                stroke="var(--ink-faint)"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                stroke="var(--ink-faint)"
                label={{ value: "Rating", angle: -90, position: "insideLeft", fill: "var(--ink-muted)", fontSize: 12, offset: 0 }}
              />
              <Tooltip
                contentStyle={{ background: "var(--board-surface)", border: "1px solid var(--board-border)", borderRadius: "var(--radius-card)", color: "var(--ink-primary)" }}
                labelFormatter={(v) => (typeof v === "string" ? new Date(v).toLocaleDateString() : "")}
              />
              <Line type="monotone" dataKey="rating" stroke={TC_COLORS[fmt] ?? "#888"} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink-faint mt-2 text-center">
            {ratingByTC[fmt].length} day{ratingByTC[fmt].length !== 1 ? "s" : ""} of data
          </p>
        </Section>
      ))}

      {/* Combined average — estimated overall playing strength */}
      {averageRatingOverTime.length > 1 && (
        <Section>
          <SectionHeader
            title="Your Estimated Playing Strength"
            subtitle="Average of all time controls — a rough estimate of your overall skill level"
          />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={averageRatingOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--board-border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                }}
                stroke="var(--ink-faint)"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                stroke="var(--ink-faint)"
                label={{ value: "Avg Rating", angle: -90, position: "insideLeft", fill: "var(--ink-muted)", fontSize: 12, offset: 0 }}
              />
              <Tooltip
                contentStyle={{ background: "var(--board-surface)", border: "1px solid var(--board-border)", borderRadius: "var(--radius-card)", color: "var(--ink-primary)" }}
                labelFormatter={(v) => (typeof v === "string" ? new Date(v).toLocaleDateString() : "")}
              />
              <Line type="monotone" dataKey="rating" stroke="var(--brass)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-ink-faint mt-2 text-center">
            Current average: <span className="text-brass font-semibold">{averageRatingOverTime[averageRatingOverTime.length - 1]?.rating ?? "—"}</span>
            {" · "}{averageRatingOverTime.length} day{averageRatingOverTime.length !== 1 ? "s" : ""} of data
          </p>
        </Section>
      )}

      {/* Activity heatmap */}
      <Section>
        <SectionHeader title="Activity — Last 12 Weeks" />
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {Array.from({ length: 12 }, (_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }, (_, d) => {
                const idx = w * 7 + d;
                const day = heatmapDays[idx];
                if (!day) return <div key={d} className="size-3" />;
                const intensity = day.count === 0 ? 0 : Math.min(Math.ceil((day.count / maxActivity) * 4), 4);
                const colors = ["var(--board-bg)", "var(--board-border)", "var(--board-surface-raised)", "var(--brass-soft)", "var(--brass)"];
                return (
                  <div
                    key={d}
                    className="size-3 rounded-sm cursor-pointer"
                    style={{ background: colors[intensity] }}
                    title={`${day.date.toLocaleDateString()}: ${day.count} games`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-ink-faint">
          <span>Less</span>
          {["var(--board-bg)", "var(--board-border)", "var(--board-surface-raised)", "var(--brass-soft)", "var(--brass)"].map((c) => (
            <div key={c} className="size-3 rounded-sm" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </Section>

      {/* Win rate per time control + Overall results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section>
          <SectionHeader title="Win Rate by Time Control" />
          {Object.keys(resultsByTC).length === 0 ? (
            <p className="text-ink-faint">No data.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(resultsByTC).map(([tc, r]) => {
                const t = r.win + r.loss + r.draw;
                const wr = t > 0 ? Math.round((r.win / t) * 100) : 0;
                return (
                  <div key={tc}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize" style={{ color: TC_COLORS[tc] }}>{tc}</span>
                      <span className="text-ink-muted">{r.win}W / {r.loss}L / {r.draw}D — {wr}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-board-border overflow-hidden flex">
                      <div className="h-full" style={{ width: `${(r.win / t) * 100}%`, background: "var(--win)" }} />
                      <div className="h-full" style={{ width: `${(r.draw / t) * 100}%`, background: "var(--draw)" }} />
                      <div className="h-full" style={{ width: `${(r.loss / t) * 100}%`, background: "var(--loss)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section>
          <SectionHeader title={`Overall Results (${totalG} games)`} />
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--win)" }}>{totalResults.win}</p>
              <p className="text-ink-muted text-sm">Wins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--loss)" }}>{totalResults.loss}</p>
              <p className="text-ink-muted text-sm">Losses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--draw)" }}>{totalResults.draw}</p>
              <p className="text-ink-muted text-sm">Draws</p>
            </div>
          </div>
          {resultPie.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={resultPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {resultPie.map((_, i) => <Cell key={i} fill={RESULT_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--board-surface)", border: "1px solid var(--board-border)", borderRadius: "var(--radius-card)", color: "var(--ink-primary)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Section className="text-center">
          <p className="text-ink-faint text-xs uppercase tracking-wider">Current Streak</p>
          <p className="text-3xl font-bold mt-1" style={{ color: streaks.currentResult === "win" ? "var(--win)" : streaks.currentResult === "loss" ? "var(--loss)" : "var(--draw)" }}>
            {streaks.currentCount}
          </p>
          <p className="text-ink-muted text-sm capitalize">{streaks.currentResult || "—"}</p>
        </Section>
        <Section className="text-center">
          <p className="text-ink-faint text-xs uppercase tracking-wider">Longest Win Streak</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--win)" }}>{streaks.bestWin}</p>
        </Section>
        <Section className="text-center">
          <p className="text-ink-faint text-xs uppercase tracking-wider">Longest Loss Streak</p>
          <p className="text-3xl font-bold mt-1" style={{ color: "var(--loss)" }}>{streaks.bestLoss}</p>
        </Section>
      </div>

      {/* Form — last 20 */}
      <Section>
        <SectionHeader title="Form — Last 20 Games" />
        <div className="flex flex-wrap gap-1.5">
          {streaks.last20.map((g, i) => (
            <div
              key={i}
              className="size-7 rounded-chip flex items-center justify-center text-xs font-bold cursor-pointer"
              style={{
                background: g.result === "win" ? "var(--win)" : g.result === "loss" ? "var(--loss)" : "var(--ink-faint)",
                color: g.result === "win" ? "var(--board-bg)" : g.result === "loss" ? "var(--board-bg)" : "var(--ink-primary)",
              }}
              title={`${g.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} vs ${g.opponent} (${g.opponentRating})`}
            >
              {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
            </div>
          ))}
        </div>
      </Section>

      {/* Opponent rating distribution */}
      {oppDist.length > 1 && (
        <Section>
          <SectionHeader title="Opponent Rating Distribution &amp; Win Rate" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={oppDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--board-border)" />
              <XAxis dataKey="range" tick={{ fill: "var(--ink-muted)", fontSize: 11 }} stroke="var(--ink-faint)" />
              <YAxis yAxisId="games" tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--ink-faint)" />
              <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} stroke="var(--ink-faint)" />
              <Tooltip contentStyle={{ background: "var(--board-surface)", border: "1px solid var(--board-border)", borderRadius: "var(--radius-card)", color: "var(--ink-primary)" }} />
              <Line yAxisId="games" type="monotone" dataKey="total" stroke="var(--tc-daily)" strokeWidth={2} dot={false} name="Games" />
              <Line yAxisId="rate" type="monotone" dataKey="winRate" stroke="var(--win)" strokeWidth={2} dot={{ r: 3 }} name="Win %" />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      )}

      {/* Best wins */}
      {bestWins.length > 0 && (
        <Section className="overflow-x-auto">
          <SectionHeader title="Best Wins" subtitle="Opponent 100+ higher rated" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-faint border-b board-rule">
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Opponent</th>
                <th className="text-right py-2 pr-3">My Rating</th>
                <th className="text-right py-2 pr-3">Opp. Rating</th>
                <th className="text-right py-2">Diff</th>
              </tr>
            </thead>
            <tbody>
              {bestWins.map((g, i) => (
                <tr key={i} className="border-b board-rule/50">
                  <td className="py-2 pr-3 text-ink-muted whitespace-nowrap">
                    {g.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-2 pr-3 font-mono">{g.opponent}</td>
                  <td className="py-2 pr-3 text-right font-mono">{g.myRating}</td>
                  <td className="py-2 pr-3 text-right font-mono">{g.opponentRating}</td>
                  <td className="py-2 text-right font-mono" style={{ color: "var(--win)" }}>+{g.opponentRating - g.myRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* New sections */}
      <RatingDeltaTimeline games={games} />
      <PerformanceVsDelta games={games} />
      <GamePacing games={games} />
      <PersonalBests games={games} />

      <ColorPerformance games={games} />
      <TerminationAnalysis games={games} />
      <CommonOpponents games={games} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrophiesClubs username={username} />
        <Tournaments username={username} />
      </div>

      <SessionAnalysis games={games} />
      <MoveTimeDistribution games={games} />
      <TimeOfDayPerformance games={games} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RatingComparison username={username} />
        <OpponentCountries games={games} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExportCSV username={username} games={gamesForSections} />
        <PGNDownload username={username} games={gamesForSections} />
      </div>

      <HeadToHead games={h2hGames} />

      <SeasonalPattern games={games} />

      {/* Opening explorer at bottom (heaviest compute) */}
      <OpeningExplorer games={games} />

      {/* Board replayer */}
      <BoardReplayer games={gamesForSections} username={username} />

      {/* Learning system */}

      {/* Recent games */}
      {games.length > 0 && (
        <Section className="overflow-x-auto">
          <SectionHeader title="Recent Games" subtitle="Last 30 games" />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-faint border-b board-rule">
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Opponent</th>
                <th className="text-right py-2 pr-3">Rating</th>
                <th className="text-right py-2 pr-3">Time</th>
                <th className="text-right py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {[...games].sort((a, b) => b.ts - a.ts).slice(0, 30).map((g, i) => (
                <tr key={i} className="border-b board-rule/50">
                  <td className="py-2 pr-3 text-ink-muted whitespace-nowrap font-mono">
                    {g.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="py-2 pr-3 font-mono">{g.opponent}</td>
                  <td className="py-2 pr-3 text-right text-ink-muted font-mono">{g.myRating}</td>
                  <td className="py-2 pr-3 text-right text-ink-faint text-xs capitalize font-mono">{g.timeClass}</td>
                  <td className="py-2 text-right font-mono text-xs">
                    <span style={{ color: g.result === "win" ? "var(--win)" : g.result === "loss" ? "var(--loss)" : "var(--draw)" }}>
                      {g.result.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}
