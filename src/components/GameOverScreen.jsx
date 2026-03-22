import { motion } from 'framer-motion';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';

function getResult(scores) {
  if (scores.left > scores.right) {
    return { text: 'RED WINS!', className: 'team-red' };
  }
  if (scores.right > scores.left) {
    return { text: 'BLUE WINS!', className: 'team-blue' };
  }
  return { text: 'DRAW!', className: '' };
}

export default function GameOverScreen({ scores, matchup, reward, onContinue }) {
  const result = getResult(scores);
  const playerChicken = matchup?.playerChicken;
  const opponentChicken = matchup?.opponentChicken;

  return (
    <ScreenLayout
      panelClassName="gameover-card"
      screenMotion={{ transition: { duration: 0.25 } }}
      panelMotion={{
        initial: { y: 18, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -8, opacity: 0 },
        transition: { type: 'spring', stiffness: 250, damping: 22 },
      }}
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

      {reward && (
        <div className="reward-panel" aria-label="Match rewards">
          <p>WIN BONUS: {reward.winBonus} PP</p>
          <p>GOAL BONUS: {reward.goalBonus} PP</p>
          <p>TOTAL EARNED: {reward.total} PP</p>
          <p>BALANCE: {reward.newBalance} PP</p>
        </div>
      )}

      <UiButton onClick={onContinue}>BACK TO DASHBOARD</UiButton>
    </ScreenLayout>
  );
}
