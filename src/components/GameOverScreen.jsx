import { motion } from 'framer-motion';

function getResult(scores) {
  if (scores.left > scores.right) {
    return { text: 'RED WINS!', className: 'team-red' };
  }
  if (scores.right > scores.left) {
    return { text: 'BLUE WINS!', className: 'team-blue' };
  }
  return { text: 'DRAW!', className: '' };
}

export default function GameOverScreen({ scores, matchup, onContinue }) {
  const result = getResult(scores);
  const playerChicken = matchup?.playerChicken;
  const opponentChicken = matchup?.opponentChicken;

  return (
    <motion.div
      className="screen-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="overlay-panel gameover-card"
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      >
        <h2 className="screen-title">
          <span className="word">FULL</span>
          <span className="word">TIME</span>
        </h2>

        <div className="final-score" aria-label="Final score">
          <span className="team-red">{scores.left}</span>
          <span>-</span>
          <span className="team-blue">{scores.right}</span>
        </div>

        <motion.p
          className={`result-line ${result.className}`.trim()}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
        >
          {result.text}
        </motion.p>

        <p className="screen-subtitle">
          YOU: {playerChicken?.name || '---'} VS CPU: {opponentChicken?.name || '---'}
        </p>

        <motion.button
          type="button"
          className="ui-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
        >
          BACK TO DASHBOARD
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
