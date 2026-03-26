import { motion } from 'framer-motion';

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTeamChickens(matchup, teamKey) {
  if (Array.isArray(matchup?.[teamKey])) {
    return matchup[teamKey];
  }

  if (teamKey === 'playerChickens' && matchup?.playerChicken) {
    return [matchup.playerChicken];
  }

  if (teamKey === 'opponentChickens' && matchup?.opponentChicken) {
    return [matchup.opponentChicken];
  }

  return [];
}

function formatChickenLine(chicken) {
  if (!chicken) return '---';
  return `${chicken.name} (SPD ${Math.round(chicken?.stats?.speed || 0)})`;
}

export default function GameHUD({
  scores,
  displayTime,
  matchup,
  ballTouched,
  onPause,
}) {
  const playerChickens = getTeamChickens(matchup, 'playerChickens');
  const opponentChickens = getTeamChickens(matchup, 'opponentChickens');

  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      <div className="absolute top-[0.6rem] right-0 left-0 flex justify-center">
        <div className="hud-strip grid h-[3rem] grid-cols-[1fr_auto_1fr] items-center px-[0.8rem] max-[720px]:h-auto max-[720px]:grid-cols-1 max-[720px]:gap-[0.35rem] max-[720px]:px-[0.6rem] max-[720px]:py-[0.4rem]">
          <p className="justify-self-start text-[clamp(0.48rem,1vw,0.62rem)] text-text-muted max-[720px]:justify-self-center">
            {ballTouched ? 'CLICK/TAP TO THROW FEED' : 'WAIT FOR FIRST TOUCH TO THROW FEED'}
          </p>

          <div className="flex items-center justify-self-center gap-[0.7rem] text-[clamp(0.72rem,1.4vw,1rem)] max-[720px]:justify-self-center" aria-live="polite">
            <motion.span
              key={`left-${scores.left}`}
              className="text-red-team"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            >
              {scores.left}
            </motion.span>
            <span>-</span>
            <motion.span
              key={`right-${scores.right}`}
              className="text-blue-team"
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
            >
              {scores.right}
            </motion.span>
          </div>

          <div className="pointer-events-auto flex items-center justify-self-end gap-[0.55rem] max-[720px]:justify-self-center">
            <p className="text-[clamp(0.62rem,1.2vw,0.85rem)] text-text-main">{formatTime(displayTime)}</p>
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

      <div className="absolute right-0 bottom-[0.6rem] left-0 flex justify-center">
        <div className="hud-strip grid min-h-[2.2rem] grid-cols-[1fr_auto_1fr] items-center gap-[0.5rem] px-[0.65rem] py-[0.45rem] max-[720px]:grid-cols-1 max-[720px]:gap-[0.25rem] max-[720px]:p-[0.45rem] max-[720px]:text-center">
          <div className="grid gap-[0.15rem] text-[clamp(0.42rem,0.8vw,0.56rem)] leading-[1.4] text-red-team max-[720px]:text-center">
            <p>YOU:</p>
            {playerChickens.length === 0 && <p>---</p>}
            {playerChickens.map((chicken) => (
              <p key={chicken.id}>{formatChickenLine(chicken)}</p>
            ))}
          </div>
          <p className="text-center text-[clamp(0.5rem,1vw,0.65rem)] text-text-main">VS</p>
          <div className="grid gap-[0.15rem] text-[clamp(0.42rem,0.8vw,0.56rem)] leading-[1.4] text-blue-team max-[720px]:text-center">
            <p>CPU:</p>
            {opponentChickens.length === 0 && <p>---</p>}
            {opponentChickens.map((chicken) => (
              <p key={chicken.id}>{formatChickenLine(chicken)}</p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
