"use client";

import { useCallback } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  date: string;
  opponent: string;
  myRating: number;
  opponentRating: number;
  result: string;
  timeClass: string;
  pgn?: string;
}

export default function ExportCSV({
  username,
  games,
}: {
  username: string;
  games: Game[];
}) {
  const download = useCallback(() => {
    const headers = ["Date", "Opponent", "My Rating", "Opponent Rating", "Result", "Time Class", "PGN"];
    const rows = games.map((g) => [
      g.date,
      g.opponent,
      g.myRating,
      g.opponentRating,
      g.result,
      g.timeClass,
      `"${(g.pgn ?? "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username}-chess-games.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [username, games]);

  if (games.length === 0) return null;

  return (
    <Section className="text-center">
      <SectionHeader title="Export Data" subtitle={`Download all ${games.length} games as CSV for offline analysis.`} />
      <button
        onClick={download}
        className="px-6 py-2.5 rounded-xl bg-tc-daily hover:bg-tc-daily font-semibold transition-colors cursor-pointer"
      >
        Download CSV
      </button>
    </Section>
  );
}
