# Chicken Soccer

A fast-paced 1v1 chicken soccer game built with React and Canvas 2D.

The first screen is your dashboard, where you see your chicken collection and their stats. Start a match to pick your chicken, then play against a random AI opponent. You influence the match by throwing chicken feed to distract the opponent. Each chicken brings its stats into the match.

The game now includes a daily chicken store and an in-game currency called Pok Pok (PP). You can earn PP from matches, then spend it to buy and name new chickens for your collection.

## How To Play

1. View your chicken collection on the dashboard.
2. Click "Start Match" to go to the pre-match screen.
3. Select your chicken and confirm to start the match.
4. Click or tap on the pitch to throw feed.
5. Press `1` for basic feed (unlimited).
6. Press `2` for slowness feed (limited inventory).
7. Nearby chickens may abandon the ball to chase feed.
8. Use feed placement strategically to open scoring chances.
9. Score more goals before the 90-second timer ends.
10. Use the shop from the dashboard to buy new chickens with PP.

## Economy and Rewards

- Currency: Pok Pok (PP)
- Reward formula:
  - Goal reward: 5 PP per goal scored (always)
  - Win bonus: random 0-50 PP (only if you win)
  - Total reward: win bonus + goal reward
- Reward payout happens at full time and is shown on the game-over screen.
- PP balance is persistent and available from the dashboard and store views.

## Daily Store

- The store is accessible from the dashboard via the SHOP button.
- Store inventory rotates daily using date-seeded generation.
- Daily inventory size is randomized between 3 and 10 chickens.
- Store chicken stats are randomized on generation.
- Prices are relative to daily listings and range from 100 to 500 PP.
- Higher-stat chickens cost more than lower-stat chickens in the same day.
- Buying flow:
  - Click BUY on a listing
  - Name your chicken in the purchase modal
  - Confirm purchase to add chicken to your collection
- Purchased listings are removed and cannot be bought again.

## Consumable Feed

- Basic feed is unlimited during matches.
- Slowness feed is a consumable you buy from the shop for 2 PP per unit.
- Slowness feed inventory persists in `localStorage` between matches.
- The chicken that consumes slowness feed gets a temporary speed penalty.
- Slowness duration is 3 seconds, then speed returns to normal.

## Chicken Collection

- Each user has a persistent collection of chickens.
- Every chicken has its own stats object. Right now the only stat is `speed`.
- Stat values use a player-facing scale from `0` to `100`, where `100` is the fastest.
- A starter chicken is generated automatically on first launch.
- Opponents are generated fresh each match with their own random stats.
- Store-bought chickens are added to the same persistent collection.

## Persistence Model

- Collection data is stored client-side in `localStorage`.
- The storage format is JSONL, with one chicken record serialized per line.
- Persistence is wrapped behind a small data access layer so it can be replaced later by a backend or different storage mechanism.
- Stat definitions and runtime conversion are centralized so future features like training and new stats can be added without rewriting the game loop.
- Player balance is stored separately in `localStorage` under player data.
- Daily store state (date + remaining listings) is stored in `localStorage`.

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
│   │   ├── primitives (shared UI)
│   │   │   ├── UiButton.jsx        — motion.button wrapper with standard hover/tap scales
│   │   │   ├── ScreenLayout.jsx    — two-layer screen-page + overlay-panel motion wrapper
│   │   │   ├── AnimatedTitle.jsx   — letter-by-letter spring title animation
│   │   │   ├── ChickenList.jsx     — chicken picker section (title + card grid)
│   │   │   └── StoreListingCard.jsx — single store listing tile (card + price + buy button)
│   │   ├── screens
│   │   │   ├── DashboardScreen.jsx
│   │   │   ├── PreMatchScreen.jsx
│   │   │   ├── GameCanvas.jsx
│   │   │   ├── GameOverScreen.jsx
│   │   │   └── StoreScreen.jsx
│   │   └── overlays
│   │       ├── GameHUD.jsx
│   │       ├── GoalOverlay.jsx
│   │       ├── PauseOverlay.jsx
│   │       ├── NamingModal.jsx
│   │       └── ChickenCard.jsx
│   ├── data/
│   │   ├── chickenDB.js
│   │   ├── chickenModel.js
│   │   ├── feedDefs.js
│   │   ├── feedInventoryDB.js
│   │   ├── statDefs.js
│   │   ├── playerDB.js
│   │   ├── rewardLogic.js
│   │   └── shopLogic.js
│   ├── engine/
│   │   ├── pitch.js
│   │   ├── ball.js
│   │   ├── chicken.js
│   │   ├── feed.js
│   │   └── utils.js
│   └── hooks/
│       ├── useGameLoop.js
│       └── useShop.js
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
- Economy:
  - Win bonus: random 0-50 PP (wins only)
  - Goal bonus: 5 PP per player goal
  - Rewards shown at full time
- Feed system:
  - Feed lasts 4 seconds
  - Attraction radius is 30px
  - Max 5 active feed piles per player
  - Feed select keys: `1` basic, `2` slowness
  - Basic feed is unlimited
  - Slowness feed is consumed from inventory and applies a 3-second speed debuff on consume
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
