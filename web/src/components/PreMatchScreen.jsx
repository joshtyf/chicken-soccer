import { useEffect, useMemo, useState } from 'react';
import AnimatedTitle from './AnimatedTitle';
import ChickenList from './ChickenList';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';
import { DEFAULT_GAME_MODE } from '../data/gameModeDefs';

const titleWords = ['PRE', 'MATCH'];

export default function PreMatchScreen({
  chickens = [],
  gameMode = DEFAULT_GAME_MODE,
  onBack,
  onConfirm,
}) {
  const [selectedChickenIds, setSelectedChickenIds] = useState([]);

  const requiredCount = Math.max(1, Number(gameMode?.chickensPerTeam) || 1);

  useEffect(() => {
    setSelectedChickenIds(chickens.slice(0, requiredCount).map((chicken) => chicken.id));
  }, [chickens, requiredCount]);

  useEffect(() => {
    setSelectedChickenIds((current) => {
      const availableIds = new Set(chickens.map((chicken) => chicken.id));
      const filtered = current.filter((id) => availableIds.has(id)).slice(0, requiredCount);
      if (filtered.length >= requiredCount) return filtered;

      const filler = chickens
        .map((chicken) => chicken.id)
        .filter((id) => !filtered.includes(id))
        .slice(0, requiredCount - filtered.length);

      return [...filtered, ...filler];
    });
  }, [chickens, requiredCount]);

  function toggleChickenSelection(chickenId) {
    setSelectedChickenIds((current) => {
      if (current.includes(chickenId)) {
        return current.filter((id) => id !== chickenId);
      }

      if (current.length >= requiredCount) {
        return current;
      }

      return [...current, chickenId];
    });
  }

  const selectedChickens = useMemo(() => {
    const selectedMap = new Map(chickens.map((chicken) => [chicken.id, chicken]));
    return selectedChickenIds.map((id) => selectedMap.get(id)).filter(Boolean);
  }, [chickens, selectedChickenIds]);

  const canStart = selectedChickens.length === requiredCount;
  const collectionTooSmall = chickens.length < requiredCount;

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
        MODE: {gameMode?.label || '1v1'}
        <br />
        CHOOSE {requiredCount} STARTING CHICKEN{requiredCount === 1 ? '' : 'S'}.
      </p>

      <p className="text-[clamp(0.5rem,1vw,0.64rem)] text-[#ffe8aa]">
        SELECTED: {selectedChickens.length}/{requiredCount}
      </p>

      {collectionTooSmall && (
        <p className="text-[clamp(0.5rem,1vw,0.64rem)] text-[#ffe08b]">
          YOU NEED AT LEAST {requiredCount} CHICKENS IN YOUR COLLECTION FOR THIS MODE.
        </p>
      )}

      <ChickenList
        chickens={chickens}
        title={`SELECT YOUR CHICKEN${requiredCount > 1 ? 'S' : ''}`}
        ariaLabel="Choose your chicken"
        selectedIds={selectedChickenIds}
        onSelect={toggleChickenSelection}
      />

      <div className="flex flex-wrap justify-center gap-[0.7rem]">
        <UiButton onClick={onBack}>BACK</UiButton>
        <UiButton
          className="pulse-hint"
          onClick={() => onConfirm(selectedChickens.map((chicken) => chicken.id))}
          disabled={!canStart}
        >
          START MATCH
        </UiButton>
      </div>
    </ScreenLayout>
  );
}
