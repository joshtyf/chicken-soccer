import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../hooks/useGameLoop';
import MenuScreen from './MenuScreen';
import GameHUD from './GameHUD';
import GoalOverlay from './GoalOverlay';
import GameOverScreen from './GameOverScreen';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const gameUi = useGameLoop(canvasRef);

  return (
    <div className="game-shell">
      <canvas ref={canvasRef} />

      <AnimatePresence>
        {gameUi.phase === 'menu' && <MenuScreen onStart={gameUi.startGame} />}
      </AnimatePresence>

      <AnimatePresence>
        {(gameUi.phase === 'playing' || gameUi.phase === 'goal') && (
          <GameHUD scores={gameUi.scores} displayTime={gameUi.displayTime} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameUi.phase === 'goal' && <GoalOverlay goalMessage={gameUi.goalMessage} />}
      </AnimatePresence>

      <AnimatePresence>
        {gameUi.phase === 'gameover' && (
          <GameOverScreen scores={gameUi.scores} onRestart={gameUi.restartGame} />
        )}
      </AnimatePresence>
    </div>
  );
}
