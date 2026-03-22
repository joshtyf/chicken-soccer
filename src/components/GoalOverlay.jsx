import { motion } from 'framer-motion';

export default function GoalOverlay({ goalMessage }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="goal-banner"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.08, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      >
        {goalMessage}
      </motion.div>
    </motion.div>
  );
}
