"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/dashboard"), { ssr: false });

export default function Home() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed) setSubmitted(trimmed);
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Chess Dashboard
        </h1>
        <p className="text-ink-muted mt-3 text-lg max-w-2xl mx-auto">
          See how you really play. Type in any Chess.com username to unlock a breakdown of
          ratings, openings, time management, opponents, and more — all in one place.
        </p>
        <p className="text-ink-faint text-sm mt-2">
          No login needed. Just pick a player and dive in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl mx-auto mb-12">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter Chess.com username, e.g. Hikaru"
          className="flex-1 px-4 py-3 rounded-xl bg-board-surface border border-board-border focus:outline-none focus:ring-2 focus:ring-brass text-white placeholder-ink-faint"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-tc-daily hover:bg-tc-daily font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      {submitted && <Dashboard key={submitted} username={submitted} />}
    </div>
  );
}
