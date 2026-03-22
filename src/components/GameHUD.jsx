import { motion } from 'framer-motion';

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GameHUD({
  scores,
  displayTime,
  matchup,
  onPause,
}) {
  const playerChicken = matchup?.playerChicken;
  const opponentChicken = matchup?.opponentChicken;

  return (
    <motion.div
      className="hud"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      <div className="hud-top">
        <div className="hud-strip hud-main">
          <p className="feed-tip">CLICK/TAP TO THROW FEED</p>

          <div className="scoreboard" aria-live="polite">
            <motion.span
              key={`left-${scores.left}`}
              className="team-red"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            >
              {scores.left}
            </motion.span>
            <span>-</span>
            <motion.span
              key={`right-${scores.right}`}
              className="team-blue"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            >
              {scores.right}
            </motion.span>
          </div>

          <div className="hud-actions">
            <p className="timer">{formatTime(displayTime)}</p>
            <motion.button
              type="button"
              className="pause-btn"
              aria-label="Pause game"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onPause}
            >
              II
            </motion.button>
          </div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-strip hud-vs">
          <p className="team-red matchup-line">
            YOU: {playerChicken?.name || '---'} (SPD {Math.round(playerChicken?.stats?.speed || 0)})
          </p>
          <p className="matchup-separator">VS</p>
          <p className="team-blue matchup-line">
            CPU: {opponentChicken?.name || '---'} (SPD {Math.round(opponentChicken?.stats?.speed || 0)})
          </p>
        </div>
      </div>
    </motion.div>
  );
}
