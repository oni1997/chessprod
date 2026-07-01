export interface PlayerProfile {
  username: string;
  name?: string;
  avatar?: string;
  location?: string;
  joined: number;
  last_online: number;
}

export interface RatingStat {
  format: string;
  rating: number;
  best: number;
  games: number;
}

export interface RatingPoint {
  date: string;
  rating: number;
}

export interface GameRecord {
  date: string;
  opponent: string;
  opponentRating: number | null;
  myRating: number | null;
  result: string;
  timeClass: string;
  rules: string;
}

export interface PlayerData {
  profile: PlayerProfile | null;
  stats: RatingStat[];
  ratingHistory: RatingPoint[];
  recentGames: GameRecord[];
  results: { win: number; loss: number; draw: number };
}

export interface ParsedPGN {
  opening: string;
  eco: string;
  termination: string;
  timeControl: string;
  moveCount: number;
}

export function parsePGN(pgn: string): ParsedPGN {
  const get = (tag: string): string => {
    const m = pgn.match(new RegExp(`\\[${tag}\\s+"([^"]*)"`));
    return m ? m[1] : "";
  };
  const moves = pgn.replace(/\[.*?\]\s*/g, "").trim();
  const moveNumbers = moves.match(/\d+\.\s+/g);
  const moveCount = moveNumbers ? moveNumbers.length : 0;

  return {
    opening: get("Opening") || "Unknown",
    eco: get("ECO") || "",
    termination: get("Termination") || "",
    timeControl: get("TimeControl") || "",
    moveCount,
  };
}

export function parseMoveTimes(pgn: string): number[] {
  const times: number[] = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(pgn)) !== null) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val)) times.push(val);
  }
  return times;
}

export function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
    syy += p.y * p.y;
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const r2 = (n * sxy - sx * sy) ** 2 / ((n * sxx - sx * sx) * (n * syy - sy * sy));
  return { slope, intercept, r2 };
}
