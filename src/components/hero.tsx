export interface HeroProps {
  username: string;
  displayName: string;
  avatarUrl: string;
  location?: string;
  memberSince: string;
  lastOnline: string;
  ratings: Record<"bullet" | "blitz" | "rapid" | "daily", { rating: number; best: number; games: number } | null>;
  primaryFormat: "bullet" | "blitz" | "rapid" | "daily";
}

const TC_LABEL: Record<string, string> = {
  bullet: "Bullet", blitz: "Blitz", rapid: "Rapid", daily: "Daily",
};

const TC_VAR: Record<string, string> = {
  bullet: "var(--tc-bullet)",
  blitz: "var(--tc-blitz)",
  rapid: "var(--tc-rapid)",
  daily: "var(--tc-daily)",
};

export default function Hero({
  username,
  displayName,
  avatarUrl,
  location,
  memberSince,
  lastOnline,
  ratings,
  primaryFormat,
}: HeroProps) {
  const allFormats = ["bullet", "blitz", "rapid", "daily"] as const;

  return (
    <div className="board-card p-5 sm:p-6 relative overflow-hidden">
      {/* Checkerboard watermark */}
      <div
        className="absolute top-0 right-0 size-48 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "repeating-conic-gradient(var(--ink-primary) 0% 25%, transparent 25% 50%)",
          backgroundSize: "16px 16px",
        }}
        aria-hidden
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        {/* Left */}
        <div className="flex items-center gap-4">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={username}
              className="size-16 sm:size-20 rounded-chip border border-board-border"
            />
          )}
          <div className="space-y-0.5">
            <h1 className="font-display text-2xl sm:text-3xl text-ink-primary">{displayName}</h1>
            <p className="font-mono text-sm text-ink-muted">@{username}</p>
            {location && <p className="text-xs text-ink-faint">{location}</p>}
            <p className="text-xs text-ink-faint">
              Joined {memberSince} &middot; Last online {lastOnline}
            </p>
          </div>
        </div>

        {/* Right — The Clock */}
        <div className="flex items-stretch gap-4 p-3 sm:p-4 rounded-card border border-brass-border bg-brass-soft">
          {/* Primary format (big) */}
          <div className="flex flex-col items-center justify-center min-w-[80px]">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: TC_VAR[primaryFormat] }}
            >
              {TC_LABEL[primaryFormat]}
            </span>
            <span className="font-display text-4xl sm:text-5xl leading-none mt-1" style={{ color: TC_VAR[primaryFormat] }}>
              {ratings[primaryFormat]?.rating ?? "—"}
            </span>
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-board-border self-stretch" />

          {/* Other formats (compact) */}
          <div className="flex flex-col justify-center gap-1.5">
            {allFormats
              .filter((f) => f !== primaryFormat)
              .map((f) => {
                const r = ratings[f];
                return (
                  <div key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: TC_VAR[f] }} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint min-w-[36px]">
                      {TC_LABEL[f]}
                    </span>
                    <span className="font-mono text-sm text-ink-primary">{r?.rating ?? "—"}</span>
                    {r?.best && (
                      <span className="font-mono text-[10px] text-ink-faint">Best {r.best}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
