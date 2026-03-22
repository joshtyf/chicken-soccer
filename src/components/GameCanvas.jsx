import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../hooks/useGameLoop';
import GameHUD from './GameHUD';
import GoalOverlay from './GoalOverlay';
import PauseOverlay from './PauseOverlay';

function FeedSelector({ selectedFeedType, feedCounts }) {
  const slowCount = feedCounts?.slowness || 0;

  return (
    <div className="feed-selector-bar" aria-label="Feed options">
      <p className={`feed-slot ${selectedFeedType === 'basic' ? 'feed-slot--active' : ''}`}>
        [1] BASIC FEED <span className="feed-count">INFINITY</span>
      </p>
      <p
        className={[
          'feed-slot',
          selectedFeedType === 'slowness' ? 'feed-slot--active' : '',
          slowCount <= 0 ? 'feed-slot--empty' : '',
        ].join(' ')}
      >
        [2] SLOW FEED <span className="feed-count">x{slowCount}</span>
      </p>
    </div>
  );
}

export default function GameCanvas({ matchup, onMatchEnd, onQuit }) {
  const canvasRef = useRef(null);
  const gameUi = useGameLoop(canvasRef, { matchup, onMatchEnd, onQuit });
  const showGameUi = gameUi.phase === 'playing' || gameUi.phase === 'goal' || gameUi.phase === 'paused';

  return (
    <div className="game-wrapper">
      <div className="game-shell">
        <canvas ref={canvasRef} />

        <AnimatePresence>
          {showGameUi && (
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

      {showGameUi && (
        <FeedSelector selectedFeedType={gameUi.selectedFeedType} feedCounts={gameUi.feedCounts} />
      )}
    </div>
  );
}
