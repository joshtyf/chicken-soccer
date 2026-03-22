# Chicken Soccer — Project Guidelines

## Overview
A 1v1 web-based chicken soccer game. Two AI-controlled chickens play soccer on a pitch. Players don't control the chickens directly — instead, they throw chicken feed onto the pitch to distract the opposing chicken (risking distracting their own). The goal: score more goals than the opponent.

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
    GameCanvas.jsx            — Canvas element with ref, renders the game
  hooks/
    useGameLoop.js            — requestAnimationFrame loop, state, input, rendering
  engine/
    pitch.js                  — Pitch rendering, goal detection, world constants
    ball.js                   — Soccer ball physics
    chicken.js                — Chicken AI: movement, feed distraction, pixel-art sprite
    feed.js                   — Chicken feed: placement, attraction radius, decay
    utils.js                  — Collision detection, vector math helpers
```

## Game Mechanics
- Chickens move autonomously toward the ball using simple AI
- Players click/tap to throw feed onto the pitch
- Feed has an attraction radius — nearby chickens are pulled toward it
- Feed decays after a few seconds
- Chickens resume chasing the ball once feed is consumed or expires
- Goals scored when the ball enters either goal area

## Code Conventions
- ES modules with JSX for React components
- Game engine logic lives in `src/engine/` as plain JS classes (no React dependency)
- React integration via a custom `useGameLoop` hook that owns the canvas ref and animation frame
- Use `requestAnimationFrame` with delta-time for the game loop
- All positions in world coordinates; canvas scales to fit viewport
- Use AABB or circle-based collision detection
- Pixel-art assets rendered at low resolution (320×180), scaled up with nearest-neighbor interpolation

## Key Design Decisions
- No external game dependencies — pure Canvas 2D rendering, React for component structure
- Pixelated aesthetic: all rendering at a low internal resolution (320×180), scaled up to fill screen
- Chickens are drawn programmatically (sprite-style pixel art on canvas), not loaded from image files
- Feed placement is the only player interaction — keep input handling minimal

## Development
```bash
npm install     # install dependencies
npm run dev     # start Vite dev server
npm run build   # production build
```

## Skills
- See `.github/skills/game-engine/` for game development patterns and references
- See `.github/skills/premium-frontend-ui/` for immersive frontend UI craftsmanship patterns
