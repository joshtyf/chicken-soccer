import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameLoop } from '../hooks/useGameLoop';
import GameHUD from './GameHUD';
import GoalOverlay from './GoalOverlay';
import PauseOverlay from './PauseOverlay';

function FeedSelector({ selectedFeedType, feedCounts, locked }) {
  const slowCount = feedCounts?.slowness || 0;
  const barClasses = [
    'grid min-h-[1.9rem] w-full grid-cols-2 gap-[0.35rem] p-[0.3rem] max-[720px]:grid-cols-1',
    locked ? 'opacity-[0.68]' : '',
  ].filter(Boolean).join(' ');

  const baseSlotClasses = 'flex items-center justify-between gap-[0.25rem] border-2 px-[0.34rem] py-[0.34rem] text-[clamp(0.42rem,0.85vw,0.54rem)]';

  return (
    <div className={barClasses} aria-label="Feed options">
      <p
        className={[
          baseSlotClasses,
          locked
            ? 'border-white/8 bg-[rgba(12,18,28,0.75)] text-[rgba(222,236,244,0.62)]'
            : 'border-white/16 bg-[rgba(12,18,28,0.75)] text-text-muted',
          !locked && selectedFeedType === 'basic' ? 'active-selection' : '',
        ].filter(Boolean).join(' ')}
      >
        [1] BASIC FEED <span className="text-[#9ecdf2]">INFINITY</span>
      </p>
      <p
        className={[
          baseSlotClasses,
          locked
            ? 'border-white/8 bg-[rgba(12,18,28,0.75)] text-[rgba(222,236,244,0.62)]'
            : 'border-white/16 bg-[rgba(12,18,28,0.75)] text-text-muted',
          !locked && selectedFeedType === 'slowness' ? 'active-selection' : '',
          slowCount <= 0 ? 'opacity-[0.55]' : '',
        ].filter(Boolean).join(' ')}
      >
        [2] SLOW FEED <span className="text-[#9ecdf2]">x{slowCount}</span>
      </p>
      {locked && (
        <p className="col-span-full border-2 border-[rgba(255,220,124,0.32)] bg-[rgba(46,34,12,0.72)] px-[0.35rem] py-[0.24rem] text-center text-[clamp(0.4rem,0.8vw,0.52rem)] tracking-[0.08em] text-[#ffe8aa]">
          LOCKED UNTIL FIRST TOUCH
        </p>
      )}
    </div>
  );
}

export default function GameCanvas({ matchup, onMatchEnd, onQuit }) {
  const canvasRef = useRef(null);
  const gameUi = useGameLoop(canvasRef, { matchup, onMatchEnd, onQuit });
  const showGameUi = gameUi.phase === 'playing' || gameUi.phase === 'goal' || gameUi.phase === 'paused';

  return (
    <div className="grid w-[min(960px,calc(100vw-2rem))] gap-[0.45rem] max-[720px]:w-[min(960px,calc(100vw-1rem))]">
      <div className="relative w-[min(960px,calc(100vw-2rem))] aspect-[16/9] max-[720px]:w-[min(960px,calc(100vw-1rem))]">
        <canvas ref={canvasRef} />

        <AnimatePresence>
          {showGameUi && (
            <GameHUD
              scores={gameUi.scores}
              displayTime={gameUi.displayTime}
              matchup={gameUi.matchup}
              ballTouched={gameUi.ballTouched}
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
        <FeedSelector
          selectedFeedType={gameUi.selectedFeedType}
          feedCounts={gameUi.feedCounts}
          locked={!gameUi.ballTouched}
        />
      )}
    </div>
  );
}
