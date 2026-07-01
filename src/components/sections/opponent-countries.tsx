"use client";

import { useState, useEffect, useMemo } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  opponent: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "United States": "🇺🇸", "India": "🇮🇳", "Russia": "🇷🇺", "China": "🇨🇳", "Brazil": "🇧🇷",
  "Germany": "🇩🇪", "United Kingdom": "🇬🇧", "France": "🇫🇷", "Spain": "🇪🇸", "Italy": "🇮🇹",
  "Canada": "🇨🇦", "Australia": "🇦🇺", "Netherlands": "🇳🇱", "Poland": "🇵🇱", "Ukraine": "🇺🇦",
  "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰", "Finland": "🇫🇮", "Turkey": "🇹🇷",
  "Iran": "🇮🇷", "Indonesia": "🇮🇩", "Japan": "🇯🇵", "South Korea": "🇰🇷", "Mexico": "🇲🇽",
  "Argentina": "🇦🇷", "Colombia": "🇨🇴", "Chile": "🇨🇱", "Peru": "🇵🇪", "Philippines": "🇵🇭",
  "Vietnam": "🇻🇳", "Thailand": "🇹🇭", "Egypt": "🇪🇬", "Nigeria": "🇳🇬", "Kenya": "🇰🇪",
  "South Africa": "🇿🇦", "Romania": "🇷🇴", "Hungary": "🇭🇺", "Czech Republic": "🇨🇿", "Greece": "🇬🇷",
  "Portugal": "🇵🇹", "Belgium": "🇧🇪", "Switzerland": "🇨🇭", "Austria": "🇦🇹", "Bulgaria": "🇧🇬",
  "Serbia": "🇷🇸", "Croatia": "🇭🇷", "Slovakia": "🇸🇰", "Ireland": "🇮🇪", "New Zealand": "🇳🇿",
  "Zimbabwe": "🇿🇼",
};

function extractCountry(location: string): string | null {
  if (!location) return null;
  // Try last comma-separated part (most common: "City, State, Country")
  const parts = location.split(",").map((s) => s.trim());
  const last = parts[parts.length - 1];
  if (COUNTRY_FLAGS[last]) return last;
  // Try matching any known country
  for (const country of Object.keys(COUNTRY_FLAGS)) {
    if (location.includes(country)) return country;
  }
  return null;
}

export default function OpponentCountries({ games }: { games: Game[] }) {
  const [countries, setCountries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const uniqueOpponents = useMemo(() => {
    const seen = new Set<string>();
    const opps: string[] = [];
    for (const g of games) {
      if (!seen.has(g.opponent)) {
        seen.add(g.opponent);
        opps.push(g.opponent);
      }
    }
    return opps.slice(0, 30);
  }, [games]);

  useEffect(() => {
    if (uniqueOpponents.length === 0) return;
    setLoading(true);
    const cache = new Map<string, string | null>();

    const fetchAll = async () => {
      const results: Record<string, number> = {};
      const batchSize = 5;
      for (let i = 0; i < uniqueOpponents.length; i += batchSize) {
        const batch = uniqueOpponents.slice(i, i + batchSize);
        const fetched = await Promise.all(
          batch.map(async (name) => {
            if (cache.has(name)) return { name, country: cache.get(name) ?? null };
            try {
              const res = await fetch(`https://api.chess.com/pub/player/${name}`);
              if (!res.ok) return { name, country: null };
              const data = await res.json();
              const country = extractCountry(data.location ?? "");
              cache.set(name, country);
              return { name, country };
            } catch {
              return { name, country: null };
            }
          })
        );
        for (const f of fetched) {
          if (f.country) results[f.country] = (results[f.country] ?? 0) + 1;
        }
        // small delay to avoid rate limits
        if (i + batchSize < uniqueOpponents.length) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      setCountries(results);
      setLoading(false);
    };
    fetchAll();
  }, [uniqueOpponents]);

  const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0 && !loading) return null;

  return (
    <Section>
      <SectionHeader title="Opponent Countries" />
      {loading ? (
        <div className="flex items-center gap-2 text-ink-faint text-sm">
          <div className="animate-spin size-4 border-2 border-brass border-t-transparent rounded-full" />
          Fetching opponent profiles...
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map(([country, count]) => (
            <div
              key={country}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-board-border/50 text-sm"
            >
              <span>{COUNTRY_FLAGS[country] ?? "🏳"}</span>
              <span>{country}</span>
              <span className="text-ink-faint">{count}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
