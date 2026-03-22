import { motion } from 'framer-motion';

const titleWords = ['CHICKEN', 'SOCCER'];

export default function MenuScreen({ onStart }) {
  return (
    <motion.div
      className="screen-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="overlay-panel menu-card"
        initial={{ scale: 0.92, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <h1 className="screen-title" aria-label="Chicken Soccer">
          {titleWords.map((word) => (
            <div key={word}>
              {word.split('').map((char, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  className="word"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: index * 0.04 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </h1>

        <p className="screen-subtitle">
          THROW FEED TO DISTRACT CHICKENS.
          <br />
          SCORE BEFORE THE CLOCK HITS ZERO.
        </p>

        <motion.button
          type="button"
          className="ui-button pulse-hint"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
        >
          CLICK TO START
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
