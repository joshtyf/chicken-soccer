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
      panelClassName="grid min-h-[min(78%,430px)] w-[min(88%,700px)] content-center gap-4 p-[clamp(1rem,2vw,2rem)] text-center max-[720px]:w-[min(94%,700px)]"
      screenMotion={{ transition: { duration: 0.3 } }}
      panelMotion={{
        initial: { scale: 0.92, y: 10 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.05, opacity: 0 },
        transition: { type: 'spring', stiffness: 220, damping: 20 },
      }}
    >
      <AnimatedTitle words={titleWords} ariaLabel="Pre match" delayStep={0.04} duration={0.32} />

      <p className="text-[clamp(0.58rem,1.2vw,0.75rem)] leading-[1.7] text-text-muted">
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

      <div className="flex flex-wrap justify-center gap-[0.7rem]">
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
