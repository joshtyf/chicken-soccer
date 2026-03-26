import { motion } from 'framer-motion';

export default function AnimatedTitle({ words, ariaLabel, delayStep = 0.03, duration = 0.3 }) {
  return (
    <h1 className="leading-[1.25] text-text-main [text-shadow:0_0_12px_rgba(255,230,140,0.2)]" aria-label={ariaLabel}>
      {words.map((word) => (
        <div key={word}>
          {word.split('').map((char, index) => (
            <motion.span
              key={`${word}-${index}`}
              className="mx-[0.35ch] inline-block text-[clamp(1.25rem,4.4vw,2.55rem)]"
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