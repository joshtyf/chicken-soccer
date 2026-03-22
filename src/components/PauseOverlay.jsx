import { motion } from 'framer-motion';
import UiButton from './UiButton';

export default function PauseOverlay({ onResume, onMainMenu }) {
  return (
    <motion.div
      className="screen-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="overlay-panel pause-card"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <h2 className="screen-title">
          <span className="word">PAUSED</span>
        </h2>

        <p className="screen-subtitle pause-subtitle">PRESS ESC OR CHOOSE AN ACTION</p>

        <UiButton onClick={onResume}>
          RESUME
        </UiButton>

        <UiButton onClick={onMainMenu}>
          DASHBOARD
        </UiButton>
      </motion.div>
    </motion.div>
  );
}
