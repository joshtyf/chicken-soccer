# Chicken Soccer — Project Guidelines

## Overview
A 1v1 web-based chicken soccer game. Two AI-controlled chickens play soccer on a pitch. Players do not control the chickens directly. Instead, they throw chicken feed onto the pitch to distract the opposing chicken, choose a chicken from their own collection before kickoff, and bring that chicken's stats into the match. The goal is to score more goals than the opponent.

## Tech Stack
- **Frontend**: React 19 + Vite
- **Rendering**: HTML5 Canvas 2D (via React ref + custom hook)
- **Art Style**: Pixelated / retro pixel-art theme (use `image-rendering: pixelated`, chunky pixels, pixel fonts)
- **Build**: Vite dev server (`npm run dev`) and production build (`npm run build`)

## Architecture
```
index.html                    — Vite entry point
vite.config.js                — Vite + React plugin config
src/
  main.jsx                    — React root mount
  App.jsx                     — Top-level App component
  index.css                   — Pixelated theme, retro styling
  components/
    ChickenCard.jsx           — Selectable chicken card for menu collection UI
    GameCanvas.jsx            — Canvas element with ref, renders the game
    GameHUD.jsx               — Score, timer, and current matchup metadata
    GameOverScreen.jsx        — End-of-match overlay
    GoalOverlay.jsx           — Goal announcement overlay
    MenuScreen.jsx            — Main menu and chicken selection UI
  data/
    statDefs.js               — Stat metadata, sanitization, and game-value mapping
    chickenModel.js           — Chicken factories, normalization, and opponent generation
    chickenDB.js              — localStorage-backed JSONL persistence layer
  hooks/
    useGameLoop.js            — requestAnimationFrame loop, state, input, rendering
  engine/
    pitch.js                  — Pitch rendering, goal detection, world constants
    ball.js                   — Soccer ball physics
    chicken.js                — Chicken AI: movement, feed distraction, pixel-art sprite, injected game stats
    feed.js                   — Chicken feed: placement, attraction radius, decay
    utils.js                  — Collision detection, vector math helpers
```

## Game Mechanics
- Chickens move autonomously toward the ball using simple AI
- Players click/tap to throw feed onto the pitch
- Players select a chicken from their collection before the match starts
- Feed has an attraction radius — nearby chickens are pulled toward it
- Feed decays after a few seconds
- Chickens resume chasing the ball once feed is consumed or expires
- Goals scored when the ball enters either goal area
- Each chicken has a stats object; currently only `speed` is implemented on a `0-100` scale
- The selected player chicken and a randomly generated opponent are resolved into engine-ready stats at match start
- Player collection data is stored client-side as JSONL in `localStorage`

## Code Conventions
- ES modules with JSX for React components
- Domain and persistence logic lives in `src/data/`
- Game engine logic lives in `src/engine/` as plain JS classes (no React dependency)
- React integration via a custom `useGameLoop` hook that owns the canvas ref and animation frame
- Use `requestAnimationFrame` with delta-time for the game loop
- All positions in world coordinates; canvas scales to fit viewport
- Use AABB or circle-based collision detection
- Pixel-art assets rendered at low resolution (320×180), scaled up with nearest-neighbor interpolation
- New stats should be added by extending `src/data/statDefs.js` first, then resolved into runtime values rather than hardcoding behavior in the UI

## Key Design Decisions
- No external game dependencies — pure Canvas 2D rendering, React for component structure
- Pixelated aesthetic: all rendering at a low internal resolution (320×180), scaled up to fill screen
- Chickens are drawn programmatically (sprite-style pixel art on canvas), not loaded from image files
- Feed placement is the only player interaction — keep input handling minimal
- Chicken collection persistence is deliberately isolated behind a small database abstraction for future backend migration
- Stat conversion is centralized so training and additional stats can be layered on without reshaping the core loop

## Development
```bash
npm install     # install dependencies
npm run dev     # start Vite dev server
npm run build   # production build
```

## Skills
- See `.github/skills/game-engine/` for game development patterns and references
- See `.github/skills/premium-frontend-ui/` for immersive frontend UI craftsmanship patterns
