"use client";

import { useEffect, useState, useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

export default function Tournaments({ username }: { username: string }) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch(`https://api.chess.com/pub/player/${username}/tournaments`);
        if (cancelled) return;
        const data = res.ok ? await res.json() : null;
        setTournaments(data?.finished ?? []);
      } catch {}
      setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [username]);

  const sorted = useMemo(
    () => [...tournaments].sort((a: any, b: any) => (b.placement ?? 999) - (a.placement ?? 999)).slice(0, 20),
    [tournaments]
  );

  if (loading) return null;
  if (sorted.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Recent Tournaments" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-ink-faint border-b border-board-border">
            <th className="text-left py-2 pr-3">Tournament</th>
            <th className="text-right py-2 pr-3">Place</th>
            <th className="text-right py-2 pr-3">Players</th>
            <th className="text-right py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t: any, i) => (
            <tr key={i} className="border-b border-board-border/50">
              <td className="py-2 pr-3 truncate max-w-[240px] font-mono">{t.title ?? t.url?.split("/").pop() ?? "Tournament"}</td>
              <td className="py-2 pr-3 text-right">
                <span
                  className={t.placement <= 3 ? "text-result-win" : t.placement <= 10 ? "text-brass" : "text-ink-muted"}
                >
                  {t.placement != null ? `#${t.placement}` : "—"}
                </span>
              </td>
              <td className="py-2 pr-3 text-right text-ink-muted font-mono">{t.total_players ?? "—"}</td>
              <td className="py-2 text-right text-ink-muted font-mono">
                {t.wins != null ? `${t.wins}W / ${t.losses}L` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}
