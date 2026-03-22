import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import GameCanvas from './components/GameCanvas';
import DashboardScreen from './components/DashboardScreen';
import PreMatchScreen from './components/PreMatchScreen';
import GameOverScreen from './components/GameOverScreen';

const INITIAL_SCORES = { left: 0, right: 0 };

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [activeMatchup, setActiveMatchup] = useState(null);
  const [matchResult, setMatchResult] = useState({
    scores: INITIAL_SCORES,
    matchup: null,
  });

  function handleStartMatch() {
    setScreen('prematch');
  }

  function handleConfirmMatch(playerChicken, opponentChicken) {
    setActiveMatchup({ playerChicken, opponentChicken });
    setScreen('match');
  }

  function handleMatchEnd(result) {
    setMatchResult(result);
    setScreen('gameover');
  }

  function handleBackToDashboard() {
    setScreen('dashboard');
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'dashboard' && <DashboardScreen key="dashboard" onStartMatch={handleStartMatch} />}

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
          onContinue={handleBackToDashboard}
        />
      )}
    </AnimatePresence>
  );
}
