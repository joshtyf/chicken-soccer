# Chicken Soccer

A fast-paced 1v1 chicken soccer game built with React and Canvas 2D.

Two AI-controlled chickens battle it out on the pitch while players influence the match by throwing chicken feed to distract opponents. Each player now owns a small chicken collection, selects a chicken before kickoff, and brings that chicken's stats into the match.

## How To Play

1. Pick a chicken from your collection on the menu.
2. Click or tap on the pitch to throw feed.
3. Nearby chickens may abandon the ball to chase feed.
4. Use feed placement strategically to open scoring chances.
5. Score more goals before the 90-second timer ends.

## Chicken Collection

- Each user has a persistent collection of chickens.
- Every chicken has its own stats object. Right now the only stat is `speed`.
- Stat values use a player-facing scale from `0` to `100`, where `100` is the fastest.
- A starter chicken is generated automatically on first launch.
- Opponents are generated fresh each match with their own random stats.

## Persistence Model

- Collection data is stored client-side in `localStorage`.
- The storage format is JSONL, with one chicken record serialized per line.
- Persistence is wrapped behind a small data access layer so it can be replaced later by a backend or different storage mechanism.
- Stat definitions and runtime conversion are centralized so future features like training and new stats can be added without rewriting the game loop.

## Tech Stack

| Layer | Tech |
| --- | --- |
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Rendering | HTML5 Canvas 2D |
| Animation | Framer Motion |
| Language | JavaScript (ES Modules + JSX) |

## Project Structure

```text
.
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── components/
│   │   ├── ChickenCard.jsx
│   │   ├── GameCanvas.jsx
│   │   ├── GameHUD.jsx
│   │   ├── GoalOverlay.jsx
│   │   ├── GameOverScreen.jsx
│   │   └── MenuScreen.jsx
│   ├── data/
│   │   ├── chickenDB.js
│   │   ├── chickenModel.js
│   │   └── statDefs.js
│   ├── engine/
│   │   ├── pitch.js
│   │   ├── ball.js
│   │   ├── chicken.js
│   │   ├── feed.js
│   │   └── utils.js
│   └── hooks/
│       └── useGameLoop.js
└── .github/
    ├── copilot-instructions.md
    └── skills/
```

## Development

Install dependencies:

```bash
npm install
```

Run in development:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Game Mechanics

- Match length: 90 seconds
- Teams: your selected red chicken vs a randomly generated blue chicken
- Feed system:
  - Feed lasts 4 seconds
  - Attraction radius is 30px
  - Max 5 active feed piles per player
- Collection system:
  - One starter chicken is seeded automatically
  - Chickens have names, IDs, creation timestamps, and a stats object
  - `speed` is resolved from a `0-100` stat into in-game movement speed
- Chickens switch between behaviors such as chasing the ball, being distracted by feed, and celebrating goals
- Ball physics include velocity, friction, wall bounce, and goal detection

## Notes

- Internal world resolution is low-res and scaled up for a pixel-art look.
- UI overlays (menu, HUD, goal, game over) are rendered with React and Framer Motion above the canvas.
- Data flow is split into `src/data/` for persistence/domain modeling, `src/engine/` for simulation, and `src/components/` for UI.
- The stat pipeline is intentionally extensible so future work can add training and additional stats without redesigning persistence.

## License

ISC
