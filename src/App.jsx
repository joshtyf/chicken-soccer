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
const SCREENS = {
  DASHBOARD: 'dashboard',
  STORE: 'store',
  PREMATCH: 'prematch',
  MATCH: 'match',
  GAMEOVER: 'gameover',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.DASHBOARD);
  const [balance, setBalance] = useState(() => playerDB.getBalance());
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [matchResult, setMatchResult] = useState({
    scores: INITIAL_SCORES,
    matchup: null,
    reward: null,
  });

  function handleStartMatch() {
    setScreen(SCREENS.PREMATCH);
  }

  function handleConfirmMatch(playerChicken, opponentChicken) {
    setActiveMatchup({ playerChicken, opponentChicken });
    setScreen(SCREENS.MATCH);
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
    setScreen(SCREENS.GAMEOVER);
  }

  function handleBackToDashboard() {
    setScreen(SCREENS.DASHBOARD);
  }

  function handleOpenStore() {
    setScreen(SCREENS.STORE);
  }

  return (
    <AnimatePresence mode="wait">
      {screen === SCREENS.DASHBOARD && (
        <DashboardScreen
          key="dashboard"
          balance={balance}
          onStartMatch={handleStartMatch}
          onOpenStore={handleOpenStore}
        />
      )}

      {screen === SCREENS.STORE && (
        <StoreScreen
          key="store"
          onBack={handleBackToDashboard}
          onBalanceChange={setBalance}
        />
      )}

      {screen === SCREENS.PREMATCH && (
        <PreMatchScreen
          key="prematch"
          onBack={handleBackToDashboard}
          onConfirm={handleConfirmMatch}
        />
      )}

      {screen === SCREENS.MATCH && (
        <GameCanvas
          key="match"
          matchup={activeMatchup}
          onMatchEnd={handleMatchEnd}
          onQuit={handleBackToDashboard}
        />
      )}

      {screen === SCREENS.GAMEOVER && (
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
