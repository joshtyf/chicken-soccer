import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../hooks/useGameLoop';
import GameHUD from './GameHUD';
import GoalOverlay from './GoalOverlay';
import PauseOverlay from './PauseOverlay';

export default function GameCanvas({ matchup, onMatchEnd, onQuit }) {
  const canvasRef = useRef(null);
  const gameUi = useGameLoop(canvasRef, { matchup, onMatchEnd, onQuit });

  return (
    <div className="game-shell">
      <canvas ref={canvasRef} />

      <AnimatePresence>
        {(gameUi.phase === 'playing' || gameUi.phase === 'goal' || gameUi.phase === 'paused') && (
          <GameHUD
            scores={gameUi.scores}
            displayTime={gameUi.displayTime}
            matchup={gameUi.matchup}
            onPause={gameUi.togglePause}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameUi.phase === 'goal' && <GoalOverlay goalMessage={gameUi.goalMessage} />}
      </AnimatePresence>

      <AnimatePresence>
        {gameUi.phase === 'paused' && (
          <PauseOverlay onResume={gameUi.togglePause} onMainMenu={gameUi.quitToMenu} />
        )}
      </AnimatePresence>
    </div>
  );
}
