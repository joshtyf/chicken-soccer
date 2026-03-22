import { useEffect, useState } from 'react';
import AnimatedTitle from './AnimatedTitle';
import ChickenList from './ChickenList';
import ScreenLayout from './ScreenLayout';
import UiButton from './UiButton';
import { chickenDB } from '../data/chickenDB';

const titleWords = ['CHICKEN', 'SOCCER'];

export default function DashboardScreen({ onStartMatch, onOpenStore, balance = 0 }) {
  const [chickens, setChickens] = useState([]);

  useEffect(() => {
    const seededChickens = chickenDB.init();
    setChickens(seededChickens);
  }, []);

  return (
    <ScreenLayout
      panelClassName="dashboard-card"
      panelMotion={{
        initial: { scale: 0.95, y: 12 },
        animate: { scale: 1, y: 0 },
        exit: { scale: 1.02, opacity: 0 },
      }}
    >
      <AnimatedTitle words={titleWords} ariaLabel="Chicken Soccer" delayStep={0.03} duration={0.28} />

      <p className="screen-subtitle">
        VIEW YOUR CHICKENS AND THEIR STATS.
        <br />
        PICK YOUR STARTER ON THE NEXT SCREEN.
        <br />
        BALANCE: {balance} PP
      </p>

      <ChickenList
        chickens={chickens}
        title="CHICKEN COLLECTION"
        ariaLabel="Your chickens"
      />

      <div className="action-row">
        <UiButton onClick={onOpenStore}>SHOP</UiButton>
        <UiButton onClick={onStartMatch}>START MATCH</UiButton>
      </div>
    </ScreenLayout>
  );
}
