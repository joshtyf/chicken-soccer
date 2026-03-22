import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import ChickenCard from './ChickenCard';
import { chickenDB } from '../data/chickenDB';
import { generateRandomOpponent } from '../data/chickenModel';

const titleWords = ['PRE', 'MATCH'];

export default function PreMatchScreen({ onBack, onConfirm }) {
  const [chickens, setChickens] = useState([]);
  const [selectedChickenId, setSelectedChickenId] = useState('');

  useEffect(() => {
    const seededChickens = chickenDB.init();
    setChickens(seededChickens);
    if (seededChickens[0]) {
      setSelectedChickenId(seededChickens[0].id);
    }
  }, []);

  const selectedChicken = useMemo(
    () => chickens.find((chicken) => chicken.id === selectedChickenId) || null,
    [chickens, selectedChickenId]
  );

  const canStart = Boolean(selectedChicken);

  return (
    <motion.div
      className="screen-page"
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
        <h1 className="screen-title" aria-label="Pre match">
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
          CHOOSE YOUR STARTING CHICKEN.
          <br />
          YOU WILL FACE A RANDOM OPPONENT.
        </p>

        <section className="chicken-picker" aria-label="Choose your chicken">
          <p className="picker-title">SELECT YOUR CHICKEN</p>
          <div className="chicken-list">
            {chickens.map((chicken) => (
              <ChickenCard
                key={chicken.id}
                chicken={chicken}
                selected={chicken.id === selectedChickenId}
                onSelect={setSelectedChickenId}
              />
            ))}
          </div>
        </section>

        <div className="action-row">
          <motion.button
            type="button"
            className="ui-button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
          >
            BACK
          </motion.button>

          <motion.button
            type="button"
            className="ui-button pulse-hint"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onConfirm(selectedChicken, generateRandomOpponent())}
            disabled={!canStart}
          >
            START MATCH
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
