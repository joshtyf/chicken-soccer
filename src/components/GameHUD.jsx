import { motion } from 'framer-motion';

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function GameHUD({ scores, displayTime }) {
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
          <p className="feed-tip">CLICK TO THROW FEED</p>

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

          <p className="timer">{formatTime(displayTime)}</p>
        </div>
      </div>
    </motion.div>
  );
}
