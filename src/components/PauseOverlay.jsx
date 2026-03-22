import { motion } from 'framer-motion';

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

        <motion.button
          type="button"
          className="ui-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onResume}
        >
          RESUME
        </motion.button>

        <motion.button
          type="button"
          className="ui-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onMainMenu}
        >
          DASHBOARD
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
