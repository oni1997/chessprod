"use client";

import { useEffect, useState } from "react";
import { Section, SectionHeader } from "../section-header";

export default function TrophiesClubs({ username }: { username: string }) {
  const [trophies, setTrophies] = useState<any[] | null>(null);
  const [clubs, setClubs] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      const [tRes, cRes] = await Promise.all([
        fetch(`https://api.chess.com/pub/player/${username}/trophies`),
        fetch(`https://api.chess.com/pub/player/${username}/clubs`),
      ]);
      if (cancelled) return;
      const tData = tRes.ok ? await tRes.json() : null;
      const cData = cRes.ok ? await cRes.json() : null;
      setTrophies(tData?.trophies ?? []);
      setClubs(cData?.clubs ?? []);
      setLoading(false);
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [username]);

  if (loading) return null;
  if ((!trophies || trophies.length === 0) && (!clubs || clubs.length === 0)) return null;

  return (
    <Section>
      <SectionHeader title="Trophies &amp; Clubs" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trophies && trophies.length > 0 && (
          <div>
            <p className="text-ink-faint text-sm uppercase tracking-wider mb-3">Trophies ({trophies.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trophies.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{t.trophy_type === "tournament" ? "🏆" : "🥇"}</span>
                  <span className="text-ink-primary">{t.name ?? t.trophy_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {clubs && clubs.length > 0 && (
          <div>
            <p className="text-ink-faint text-sm uppercase tracking-wider mb-3">Clubs ({clubs.length})</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clubs.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>♟</span>
                  {c.icon && <img src={c.icon} alt="" className="size-5 rounded" />}
                  <span className="text-ink-primary">{c.name}</span>
                  <span className="text-ink-faint text-xs">{c.club_id}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
