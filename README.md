# Chicken Soccer

A fast-paced 1v1 chicken soccer game built with React + Canvas 2D.

Two AI-controlled chickens battle it out on the pitch while players influence the match by throwing chicken feed to distract opponents.

## How To Play

1. Start a match from the menu.
2. Click or tap on the pitch to throw feed.
3. Nearby chickens may abandon the ball to chase feed.
4. Use feed placement strategically to open scoring chances.
5. Score more goals before the 90-second timer ends.

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
│   │   ├── GameCanvas.jsx
│   │   ├── GameHUD.jsx
│   │   ├── GoalOverlay.jsx
│   │   ├── GameOverScreen.jsx
│   │   └── MenuScreen.jsx
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
- Teams: red chicken vs blue chicken (AI-controlled)
- Feed system:
  - Feed lasts 4 seconds
  - Attraction radius is 30px
  - Max 5 active feed piles per player
- Chickens switch between behaviors such as chasing the ball, being distracted by feed, and celebrating goals
- Ball physics include velocity, friction, wall bounce, and goal detection

## Notes

- Internal world resolution is low-res and scaled up for a pixel-art look.
- UI overlays (menu, HUD, goal, game over) are rendered with React and Framer Motion above the canvas.

## License

ISC
