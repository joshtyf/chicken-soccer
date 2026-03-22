import { useEffect, useMemo, useState } from 'react';
import AnimatedTitle from './AnimatedTitle';
import ChickenList from './ChickenList';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';
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
    <ScreenLayout
      panelClassName="menu-card"
      screenMotion={{ transition: { duration: 0.3 } }}
      panelMotion={{
        initial: { scale: 0.92, y: 10 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.05, opacity: 0 },
        transition: { type: 'spring', stiffness: 220, damping: 20 },
      }}
    >
      <AnimatedTitle words={titleWords} ariaLabel="Pre match" delayStep={0.04} duration={0.32} />

      <p className="screen-subtitle">
        CHOOSE YOUR STARTING CHICKEN.
        <br />
        YOU WILL FACE A RANDOM OPPONENT.
      </p>

      <ChickenList
        chickens={chickens}
        title="SELECT YOUR CHICKEN"
        ariaLabel="Choose your chicken"
        selectedId={selectedChickenId}
        onSelect={setSelectedChickenId}
      />

      <div className="action-row">
        <UiButton onClick={onBack}>BACK</UiButton>
        <UiButton
          className="pulse-hint"
          onClick={() => onConfirm(selectedChicken, generateRandomOpponent())}
          disabled={!canStart}
        >
          START MATCH
        </UiButton>
      </div>
    </ScreenLayout>
  );
}
