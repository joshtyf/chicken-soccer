import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import DashboardScreen from './components/DashboardScreen';
import PreMatchScreen from './components/PreMatchScreen';
import GameOverScreen from './components/GameOverScreen';
import StoreScreen from './components/StoreScreen';
import { playerDB } from './data/playerDB';
import { calculateMatchReward } from './data/rewardLogic';

const INITIAL_SCORES = { left: 0, right: 0 };

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [balance, setBalance] = useState(() => playerDB.getBalance());
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [matchResult, setMatchResult] = useState({
    scores: INITIAL_SCORES,
    matchup: null,
    reward: null,
  });

  function handleStartMatch() {
    setScreen('prematch');
  }

  function handleConfirmMatch(playerChicken, opponentChicken) {
    setActiveMatchup({ playerChicken, opponentChicken });
    setScreen('match');
  }

  function handleMatchEnd(result) {
    const reward = calculateMatchReward(result.scores);
    const nextBalance = playerDB.addBalance(reward.total);

    setBalance(nextBalance);
    setMatchResult({
      ...result,
      reward: {
        ...reward,
        newBalance: nextBalance,
      },
    });
    setScreen('gameover');
  }

  function handleBackToDashboard() {
    setScreen('dashboard');
  }

  function handleOpenStore() {
    setScreen('store');
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'dashboard' && (
        <DashboardScreen
          key="dashboard"
          balance={balance}
          onStartMatch={handleStartMatch}
          onOpenStore={handleOpenStore}
        />
      )}

      {screen === 'store' && (
        <StoreScreen
          key="store"
          onBack={handleBackToDashboard}
          onBalanceChange={setBalance}
        />
      )}

      {screen === 'prematch' && (
        <PreMatchScreen
          key="prematch"
          onBack={handleBackToDashboard}
          onConfirm={handleConfirmMatch}
        />
      )}

      {screen === 'match' && (
        <GameCanvas
          key="match"
          matchup={activeMatchup}
          onMatchEnd={handleMatchEnd}
          onQuit={handleBackToDashboard}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          key="gameover"
          scores={matchResult.scores}
          matchup={matchResult.matchup}
          reward={matchResult.reward}
          onContinue={handleBackToDashboard}
        />
      )}
    </AnimatePresence>
  );
}
