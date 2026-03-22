import { motion } from 'framer-motion';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';

function getResult(scores) {
  if (scores.left > scores.right) {
    return { text: 'RED WINS!', className: 'text-red-team' };
  }
  if (scores.right > scores.left) {
    return { text: 'BLUE WINS!', className: 'text-blue-team' };
  }
  return { text: 'DRAW!', className: '' };
}

export default function GameOverScreen({ scores, matchup, reward, onContinue }) {
  const result = getResult(scores);
  const playerChicken = matchup?.playerChicken;
  const opponentChicken = matchup?.opponentChicken;

  return (
    <ScreenLayout
      panelClassName="grid min-h-[min(78%,430px)] w-[min(88%,700px)] content-center gap-4 p-[clamp(1rem,2vw,2rem)] text-center"
      screenMotion={{ transition: { duration: 0.25 } }}
      panelMotion={{
        initial: { y: 18, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -8, opacity: 0 },
        transition: { type: 'spring', stiffness: 250, damping: 22 },
      }}
    >
      <h2 className="leading-[1.25] text-text-main [text-shadow:0_0_12px_rgba(255,230,140,0.2)]">
        <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">FULL</span>
        <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">TIME</span>
      </h2>

      <div className="flex items-center justify-center gap-[clamp(0.9rem,3vw,1.7rem)] text-[clamp(1.6rem,6vw,3.2rem)]" aria-label="Final score">
        <span className="text-red-team">{scores.left}</span>
        <span>-</span>
        <span className="text-blue-team">{scores.right}</span>
      </div>

      <motion.p
        className={`text-[clamp(0.9rem,2.1vw,1.2rem)] ${result.className}`.trim()}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.25 }}
      >
        {result.text}
      </motion.p>

      <p className="text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">
        YOU: {playerChicken?.name || '---'} VS CPU: {opponentChicken?.name || '---'}
      </p>

      {reward && (
        <div
          className="mx-auto grid w-[min(100%,420px)] gap-[0.42rem] border-2 border-white/20 bg-[rgba(11,20,29,0.72)] p-[0.6rem] text-[clamp(0.48rem,0.95vw,0.58rem)] text-text-main"
          aria-label="Match rewards"
        >
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
