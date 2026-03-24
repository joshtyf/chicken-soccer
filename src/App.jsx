import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import DashboardScreen from './components/DashboardScreen';
import PreMatchScreen from './components/PreMatchScreen';
import GameOverScreen from './components/GameOverScreen';
import StoreScreen from './components/StoreScreen';
import ModeSelectScreen from './components/ModeSelectScreen';
import { chickenDB } from './data/chickenDB';
import { DEFAULT_GAME_MODE } from './data/gameModeDefs';
import { playerDB } from './data/playerDB';
import { calculateMatchReward } from './data/rewardLogic';

const INITIAL_SCORES = { left: 0, right: 0 };
const SCREENS = {
  DASHBOARD: 'dashboard',
  STORE: 'store',
  MODE_SELECT: 'mode-select',
  PREMATCH: 'prematch',
  MATCH: 'match',
  GAMEOVER: 'gameover',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.DASHBOARD);
  const [balance, setBalance] = useState(() => playerDB.getBalance());
  const [selectedGameMode, setSelectedGameMode] = useState(DEFAULT_GAME_MODE);
  const [chickenCount, setChickenCount] = useState(0);
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [matchResult, setMatchResult] = useState({
    scores: INITIAL_SCORES,
    matchup: null,
    reward: null,
  });

  useEffect(() => {
    setChickenCount(chickenDB.init().length);
  }, [screen]);

  function handleStartMatch() {
    setScreen(SCREENS.MODE_SELECT);
  }

  function handleModeSelect(mode) {
    setSelectedGameMode(mode);
    setScreen(SCREENS.PREMATCH);
  }

  function handleConfirmMatch(nextMatchup) {
    setActiveMatchup(nextMatchup);
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

      {screen === SCREENS.MODE_SELECT && (
        <ModeSelectScreen
          key="mode-select"
          chickenCount={chickenCount}
          onBack={handleBackToDashboard}
          onSelectMode={handleModeSelect}
        />
      )}

      {screen === SCREENS.PREMATCH && (
        <PreMatchScreen
          key="prematch"
          gameMode={selectedGameMode}
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
