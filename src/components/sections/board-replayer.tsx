"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { Section, SectionHeader } from "../section-header";

interface Game {
  pgn: string;
  date: string;
  opponent: string;
  myRating: number;
  opponentRating: number;
  result: string;
  timeClass: string;
}

const PIECE_UNI: Record<string, string> = {
  K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟",
  k: "♔", q: "♛", r: "♖", b: "♗", n: "♘", p: "♙",
};

function fenToBoard(fen: string): string[][] {
  const board: string[][] = Array.from({ length: 8 }, () => Array(8).fill(""));
  const rows = fen.split(" ")[0].split("/");
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= "1" && ch <= "8") {
        c += parseInt(ch);
      } else {
        board[r][c] = ch;
        c++;
      }
    }
  }
  return board;
}

export default function BoardReplayer({
  games,
  username,
}: {
  games: Game[];
  username: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [moveIdx, setMoveIdx] = useState(-1);
  const [chess] = useState(() => new Chess());

  const pgnGames = useMemo(
    () => games.filter((g) => g.pgn && g.pgn.length > 100).slice(0, 50),
    [games]
  );

  const selected = selectedIdx >= 0 ? pgnGames[selectedIdx] : null;

  const moves = useMemo(() => {
    if (!selected) return [];
    try {
      const c = new Chess();
      c.loadPgn(selected.pgn);
      return c.history({ verbose: true });
    } catch {
      return [];
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    try {
      chess.reset();
      chess.loadPgn(selected.pgn);
      setMoveIdx(-1);
    } catch {
      // ignore
    }
  }, [selected, chess]);

  const board = useMemo(() => {
    if (!selected) return null;
    try {
      const c = new Chess();
      c.loadPgn(selected.pgn);
      const hist = c.history({ verbose: true });
      const target = new Chess();
      for (let i = 0; i <= moveIdx && i < hist.length; i++) {
        target.move(hist[i].san);
      }
      return fenToBoard(target.fen());
    } catch {
      return null;
    }
  }, [selected, moveIdx]);

  const handleSelect = useCallback((idx: number) => {
    setSelectedIdx(idx);
    setMoveIdx(-1);
  }, []);

  const goTo = useCallback((idx: number) => {
    setMoveIdx(Math.max(-1, Math.min(idx, moves.length - 1)));
  }, [moves.length]);

  if (pgnGames.length === 0) return null;

  return (
    <Section>
      <SectionHeader title="Board Replayer" />

      {/* Game selector */}
      <select
        value={selectedIdx}
        onChange={(e) => handleSelect(parseInt(e.target.value))}
        className="w-full mb-4 bg-board-border border border-board-border rounded-xl px-4 py-2 text-sm text-ink-primary focus:outline-none cursor-pointer"
      >
        <option value={-1}>Select a game to replay...</option>
        {pgnGames.map((g, i) => (
          <option key={i} value={i}>
            {new Date(g.date).toLocaleDateString()} — vs {g.opponent} ({g.result.toUpperCase()})
          </option>
        ))}
      </select>

      {selected && board && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Board */}
          <div className="w-full max-w-[320px] mx-auto md:mx-0">
            <div className="grid grid-cols-8 border-2 border-board-border rounded overflow-hidden">
              {board.flat().map((piece, i) => {
                const row = Math.floor(i / 8);
                const col = i % 8;
                const light = (row + col) % 2 === 0;
                return (
                  <div
                    key={i}
                    className="aspect-square flex items-center justify-center text-lg md:text-2xl"
                    style={{ background: light ? "#f0d9b5" : "#b58863" }}
                  >
                    {piece ? (
                      <span style={{ color: piece === piece.toUpperCase() ? "#1a1a1a" : "#fff", textShadow: piece !== piece.toUpperCase() ? "0 1px 2px rgba(0,0,0,0.5)" : "none" }}>
                        {PIECE_UNI[piece] ?? ""}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls + Moves */}
          <div className="flex-1 min-w-0">
            {/* Navigation */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => goTo(-1)} className="px-3 py-1.5 rounded-lg bg-board-border hover:bg-board-raised text-sm cursor-pointer">⏮</button>
              <button onClick={() => goTo(moveIdx - 1)} disabled={moveIdx < 0} className="px-3 py-1.5 rounded-lg bg-board-border hover:bg-board-raised text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">◀</button>
              <span className="text-sm text-ink-muted min-w-[80px] text-center">
                {moveIdx < 0 ? "Start" : `${Math.floor(moveIdx / 2) + 1}${moveIdx % 2 === 0 ? "w" : "b"}`}
              </span>
              <button onClick={() => goTo(moveIdx + 1)} disabled={moveIdx >= moves.length - 1} className="px-3 py-1.5 rounded-lg bg-board-border hover:bg-board-raised text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">▶</button>
              <button onClick={() => goTo(moves.length - 1)} disabled={moves.length === 0} className="px-3 py-1.5 rounded-lg bg-board-border hover:bg-board-raised text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">⏭</button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={-1}
              max={moves.length - 1}
              value={moveIdx}
              onChange={(e) => goTo(parseInt(e.target.value))}
              className="w-full mb-4 accent-brass cursor-pointer"
            />

            {/* Move list */}
            <div className="max-h-48 overflow-y-auto bg-board-bg rounded-xl p-3 text-sm font-mono">
              {moves.length === 0 ? (
                <p className="text-ink-faint">Loading moves...</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => {
                    const w = moves[i * 2];
                    const b = moves[i * 2 + 1];
                    return (
                      <div key={i} className={`contents ${moveIdx === i * 2 ? "text-tc-daily" : moveIdx === i * 2 + 1 ? "text-tc-daily" : "text-ink-muted"}`}>
                        <span className="text-ink-faint select-none">{i + 1}.</span>
                        <span
                          className={`cursor-pointer hover:text-white ${moveIdx === i * 2 ? "text-tc-daily" : ""}`}
                          onClick={() => goTo(i * 2)}
                        >
                          {w.san}
                        </span>
                        <span />
                        {b ? (
                          <span
                            className={`cursor-pointer hover:text-white ${moveIdx === i * 2 + 1 ? "text-tc-daily" : ""}`}
                            onClick={() => goTo(i * 2 + 1)}
                          >
                            {b.san}
                          </span>
                        ) : <span />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
