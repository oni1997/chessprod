"use client";

import { useCallback } from "react";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
  date: string;
  opponent: string;
}

export default function PGNDownload({
  username,
  games,
}: {
  username: string;
  games: Game[];
}) {
  const download = useCallback(() => {
    const pgns = games
      .filter((g) => g.pgn)
      .map((g) => g.pgn);
    if (pgns.length === 0) return;
    const blob = new Blob([pgns.join("\n\n"), ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${username}-chess-games.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }, [username, games]);

  const pgnCount = games.filter((g) => g.pgn).length;
  if (pgnCount === 0) return null;

  return (
    <Section className="text-center">
      <SectionHeader title="Download PGN" subtitle={`Download all ${pgnCount} games as a single .pgn file for analysis in chess software.`} />
      <button
        onClick={download}
        className="px-6 py-2.5 rounded-xl bg-brass hover:bg-brass/80 font-semibold transition-colors cursor-pointer"
      >
        Download .PGN
      </button>
    </Section>
  );
}
