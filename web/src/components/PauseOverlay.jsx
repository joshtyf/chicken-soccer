import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import UiButton from './UiButton';

export default function PauseOverlay({ onResume, onMainMenu }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="overlay-panel grid min-h-[280px] w-[min(86%,460px)] content-center gap-[0.9rem] p-[clamp(1rem,2vw,1.6rem)] text-center"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <AnimatePresence mode="wait">
          {!confirming ? (
            <motion.div
              key="pause"
              className="grid gap-[0.9rem]"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="leading-[1.25] text-text-main [text-shadow:0_0_12px_rgba(255,230,140,0.2)]">
                <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">PAUSED</span>
              </h2>
              <p className="mb-[0.25rem] text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">PRESS ESC OR CHOOSE AN ACTION</p>
              <UiButton onClick={onResume}>RESUME</UiButton>
              <UiButton onClick={() => setConfirming(true)}>EXIT GAME</UiButton>
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              className="grid gap-[0.9rem]"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="leading-[1.25] text-text-main [text-shadow:0_0_12px_rgba(255,230,140,0.2)]">
                <span className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]">EXIT GAME?</span>
              </h2>
              <p className="mb-[0.25rem] text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">MATCH PROGRESS WILL BE LOST</p>
              <UiButton onClick={() => setConfirming(false)}>CANCEL</UiButton>
              <UiButton onClick={onMainMenu}>CONFIRM EXIT</UiButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
