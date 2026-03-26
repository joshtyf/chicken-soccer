import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import DashboardScreen from './components/DashboardScreen';
import PreMatchScreen from './components/PreMatchScreen';
import GameOverScreen from './components/GameOverScreen';
import StoreScreen from './components/StoreScreen';
import ModeSelectScreen from './components/ModeSelectScreen';
import { DEFAULT_GAME_MODE } from './data/gameModeDefs';
import {
  createMatch,
  getCollection,
  getPlayer,
  initCollection,
} from './services/api';
import { ensureRegistered } from './services/auth';

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
  const [balance, setBalance] = useState(0);
  const [chickens, setChickens] = useState([]);
  const [selectedGameMode, setSelectedGameMode] = useState(DEFAULT_GAME_MODE);
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [matchResult, setMatchResult] = useState({
    scores: INITIAL_SCORES,
    matchup: null,
    reward: null,
  });

  async function refreshCollection() {
    const items = await getCollection();
    setChickens(items);
    return items;
  }

  async function bootstrap() {
    await ensureRegistered();

    const player = await getPlayer();
    setBalance(player?.balance || 0);

    let items = await getCollection();
    if (!Array.isArray(items) || items.length === 0) {
      items = await initCollection();
    }
    setChickens(items);
  }

  useEffect(() => {
    bootstrap().catch((error) => {
      console.error(error);
    });
  }, []);

  function handleStartMatch() {
    setScreen(SCREENS.MODE_SELECT);
  }

  function handleModeSelect(mode) {
    setSelectedGameMode(mode);
    setScreen(SCREENS.PREMATCH);
  }

  async function handleConfirmMatch(selectedChickenIds) {
    const response = await createMatch(selectedChickenIds, selectedGameMode.id);
    const selectedMap = new Set(selectedChickenIds);

    setActiveMatchup({
      sessionId: response.sessionId,
      playerChickens: chickens.filter((chicken) => selectedMap.has(chicken.id)),
      opponentChickens: response.opponentChickens || [],
      gameMode: selectedGameMode,
      feedInventory: response.feedInventory || { slowness: 0 },
    });
    setScreen(SCREENS.MATCH);
  }

  function handleMatchEnd(result) {
    const reward = result?.reward || null;

    if (reward?.newBalance != null) {
      setBalance(reward.newBalance);
    }

    setMatchResult({
      ...result,
      reward,
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
          chickens={chickens}
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
          onCollectionChange={refreshCollection}
        />
      )}

      {screen === SCREENS.MODE_SELECT && (
        <ModeSelectScreen
          key="mode-select"
          chickenCount={chickens.length}
          onBack={handleBackToDashboard}
          onSelectMode={handleModeSelect}
        />
      )}

      {screen === SCREENS.PREMATCH && (
        <PreMatchScreen
          key="prematch"
          chickens={chickens}
          gameMode={selectedGameMode}
          onBack={handleBackToDashboard}
          onConfirm={(selectedChickenIds) => {
            handleConfirmMatch(selectedChickenIds).catch((error) => {
              console.error(error);
            });
          }}
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
