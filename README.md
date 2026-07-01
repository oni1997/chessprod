# Chess Dashboard

Two months of silent offline work - finally decided to finish and push this project.

A visual analytics dashboard for Chess.com players. Enter any username and get a deep breakdown of their ratings, openings, time management, session patterns, tournaments, and more.

Built with data from the [Chess.com PubAPI](https://www.chess.com/news/view/published-data-api).

## Features

- **Profile overview** — rating clocks for every time control, member since, last online
- **Rating history** — individual charts per time control + combined estimated playing strength
- **Opening explorer** — which openings you play and how you score in each
- **Time analysis** — average move times by time control
- **Session analysis** — daily play sessions with rating changes
- **Head-to-head** — your record against any opponent
- **Tournaments** — placement history
- **Activity heatmap** — last 12 weeks at a glance
- And more: game pacing, move time distribution, color performance, termination analysis, opponent countries, personal bests, board replayer

## Tech Stack

- **Framework:** Next.js
- **Charts:** Recharts
- **PGN parsing:** chess.js
- **API:** [Chess.com PubAPI](https://www.chess.com/news/view/published-data-api)
- **Styling:** Tailwind CSS (custom "Walnut & Brass" design tokens)

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), type in a Chess.com username, and go.

**Live demo:** [https://chessprod.vercel.app/](https://chessprod.vercel.app/)

## Credits

Game data and player stats provided by the [Chess.com PubAPI](https://www.chess.com/news/view/published-data-api). This project is not affiliated with or endorsed by Chess.com.

**Author:** [oni1997](https://github.com/oni1997/chessprod)