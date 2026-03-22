import { motion } from 'framer-motion';

export default function AnimatedTitle({ words, ariaLabel, delayStep = 0.03, duration = 0.3 }) {
  return (
    <h1 className="screen-title" aria-label={ariaLabel}>
      {words.map((word) => (
        <div key={word}>
          {word.split('').map((char, index) => (
            <motion.span
              key={`${word}-${index}`}
              className="word"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration, delay: index * delayStep }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      ))}
    </h1>
  );
}