import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ChickenCard from './ChickenCard';
import { chickenDB } from '../data/chickenDB';

const titleWords = ['CHICKEN', 'SOCCER'];

export default function DashboardScreen({ onStartMatch }) {
  const [chickens, setChickens] = useState([]);

  useEffect(() => {
    const seededChickens = chickenDB.init();
    setChickens(seededChickens);
  }, []);

  return (
    <motion.div
      className="screen-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        className="overlay-panel dashboard-card"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 1.02, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
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
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          ))}
        </h1>

        <p className="screen-subtitle">
          VIEW YOUR CHICKENS AND THEIR STATS.
          <br />
          PICK YOUR STARTER ON THE NEXT SCREEN.
        </p>

        <section className="chicken-picker" aria-label="Your chickens">
          <p className="picker-title">CHICKEN COLLECTION</p>
          <div className="chicken-list">
            {chickens.map((chicken) => (
              <ChickenCard key={chicken.id} chicken={chicken} selected={false} />
            ))}
          </div>
        </section>

        <motion.button
          type="button"
          className="ui-button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartMatch}
        >
          START MATCH
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
