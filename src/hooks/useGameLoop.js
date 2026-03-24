// Custom hook that runs the Canvas game loop via requestAnimationFrame

import { useRef, useEffect, useCallback, useState } from 'react';
import { WORLD_W, WORLD_H, PITCH, drawPitch, isInLeftGoal, isInRightGoal } from '../engine/pitch';
import { Ball } from '../engine/ball';
import { Chicken } from '../engine/chicken';
import { FeedManager } from '../engine/feed';
import {
  generateRandomOpponents,
  generateStarterChicken,
  resolveGameStats,
} from '../data/chickenModel';
import { DEFAULT_GAME_MODE } from '../data/gameModeDefs';
import { getFeedDef } from '../data/feedDefs';
import { feedInventoryDB } from '../data/feedInventoryDB';

const GAME_DURATION = 90;

function getTeamSlots(team, teamSize) {
  const centerY = PITCH.y + PITCH.h / 2;

  if (teamSize <= 1) {
    return [
      {
        role: 'solo',
        x: team === 'left' ? PITCH.x + 40 : PITCH.x + PITCH.w - 40,
        y: centerY,
      },
    ];
  }

  if (team === 'left') {
    return [
      { role: 'striker', x: PITCH.x + 60, y: centerY - 14 },
      { role: 'defender', x: PITCH.x + 25, y: centerY + 14 },
    ];
  }

  return [
    { role: 'striker', x: PITCH.x + PITCH.w - 60, y: centerY - 14 },
    { role: 'defender', x: PITCH.x + PITCH.w - 25, y: centerY + 14 },
  ];
}

export function useGameLoop(canvasRef, { matchup: selectedMatchup, onMatchEnd, onQuit } = {}) {
  const [phase, setPhase] = useState('playing');
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [displayTime, setDisplayTime] = useState(GAME_DURATION);
  const [goalMessage, setGoalMessage] = useState('');
  const [ballTouched, setBallTouched] = useState(false);
  const [matchup, setMatchup] = useState(
    selectedMatchup || {
      playerChickens: [],
      opponentChickens: [],
      gameMode: DEFAULT_GAME_MODE,
    }
  );
  const [selectedFeedType, setSelectedFeedType] = useState('basic');
  const [feedCounts, setFeedCounts] = useState({ slowness: 0 });
  const lastDisplayedSecond = useRef(GAME_DURATION);

  const gameState = useRef({
    ball: new Ball(),
    playerChickens: [],
    opponentChickens: [],
    allChickens: [],
    feedManager: new FeedManager(),
    matchup: {
      playerChickens: [],
      opponentChickens: [],
      gameMode: DEFAULT_GAME_MODE,
    },
    scoreLeft: 0,
    scoreRight: 0,
    gameTime: GAME_DURATION,
    phase: 'playing', // 'playing' | 'paused' | 'goal' | 'gameover'
    goalTimer: 0,
    goalMessage: '',
    lastTime: 0,
    animFrameId: null,
    clickQueue: [],
    selectedFeedType: 'basic',
    feedCounts: { slowness: 0 },
    ballTouched: false,
  });

  const setupMatchup = useCallback((nextMatchup) => {
    const s = gameState.current;

    const inputPlayerChickens = Array.isArray(nextMatchup?.playerChickens)
      ? nextMatchup.playerChickens.filter(Boolean)
      : [];
    const inputOpponentChickens = Array.isArray(nextMatchup?.opponentChickens)
      ? nextMatchup.opponentChickens.filter(Boolean)
      : [];

    const configuredTeamSize = Number(nextMatchup?.gameMode?.chickensPerTeam);
    const inferredTeamSize = inputPlayerChickens.length || inputOpponentChickens.length || 1;
    const teamSize = Math.max(1, configuredTeamSize || inferredTeamSize);

    const playerChickens = [...inputPlayerChickens];
    while (playerChickens.length < teamSize) {
      playerChickens.push(generateStarterChicken());
    }

    const opponentChickens = [...inputOpponentChickens];
    if (opponentChickens.length < teamSize) {
      opponentChickens.push(...generateRandomOpponents(teamSize - opponentChickens.length));
    }

    const normalizedMatchup = {
      playerChickens: playerChickens.slice(0, teamSize),
      opponentChickens: opponentChickens.slice(0, teamSize),
      gameMode: nextMatchup?.gameMode || DEFAULT_GAME_MODE,
    };

    const leftSlots = getTeamSlots('left', teamSize);
    const rightSlots = getTeamSlots('right', teamSize);

    s.playerChickens = normalizedMatchup.playerChickens.map((chicken, index) => {
      const slot = leftSlots[index] || leftSlots[leftSlots.length - 1];
      return new Chicken('left', slot.x, slot.y, resolveGameStats(chicken), slot.role);
    });

    s.opponentChickens = normalizedMatchup.opponentChickens.map((chicken, index) => {
      const slot = rightSlots[index] || rightSlots[rightSlots.length - 1];
      return new Chicken('right', slot.x, slot.y, resolveGameStats(chicken), slot.role);
    });

    s.allChickens = [...s.playerChickens, ...s.opponentChickens];
    s.matchup = normalizedMatchup;

    setMatchup(normalizedMatchup);
  }, []);

  const resetAfterGoal = useCallback(() => {
    const s = gameState.current;
    s.ball.reset();
    for (const chicken of s.allChickens) {
      chicken.resetPosition();
    }
    s.feedManager.reset();
    s.ballTouched = false;
    setBallTouched(false);
  }, []);

  const resetMatch = useCallback(() => {
    const s = gameState.current;
    const slownessCount = feedInventoryDB.getCount('slowness');

    s.phase = 'playing';
    s.scoreLeft = 0;
    s.scoreRight = 0;
    s.gameTime = GAME_DURATION;
    s.goalTimer = 0;
    s.goalMessage = '';
    s.feedManager.reset();
    s.ball.reset();
    for (const chicken of s.allChickens) {
      chicken.resetPosition();
    }
    s.selectedFeedType = 'basic';
    s.feedCounts = { slowness: slownessCount };
    s.ballTouched = false;

    lastDisplayedSecond.current = GAME_DURATION;
    setPhase('playing');
    setScores({ left: 0, right: 0 });
    setDisplayTime(GAME_DURATION);
    setGoalMessage('');
    setBallTouched(false);
    setSelectedFeedType('basic');
    setFeedCounts({ slowness: slownessCount });
  }, []);

  useEffect(() => {
    setupMatchup(selectedMatchup);
    resetMatch();
  }, [resetMatch, selectedMatchup, setupMatchup]);

  const togglePause = useCallback(() => {
    const s = gameState.current;
    if (s.phase === 'playing') {
      s.phase = 'paused';
      setPhase('paused');
      return;
    }

    if (s.phase === 'paused') {
      s.phase = 'playing';
      // Prevent a large delta-time jump after resuming.
      s.lastTime = performance.now();
      setPhase('playing');
    }
  }, []);

  const quitToMenu = useCallback(() => {
    onQuit?.();
  }, [onQuit]);

  // Click handler — enqueue clicks for the game loop to consume
  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    gameState.current.clickQueue.push({ x, y });
  }, [canvasRef]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    gameState.current.clickQueue.push({ x, y });
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchend', handleTouchEnd);

    function handleKeyDown(event) {
      const s = gameState.current;
      if (event.key === 'Escape') {
        if (s.phase !== 'playing' && s.phase !== 'paused') return;
        event.preventDefault();
        togglePause();
        return;
      }

      if (s.phase !== 'playing' && s.phase !== 'paused' && s.phase !== 'goal') return;

      if (event.key === '1') {
        event.preventDefault();
        s.selectedFeedType = 'basic';
        setSelectedFeedType('basic');
        return;
      }

      if (event.key === '2') {
        const available = s.feedCounts.slowness;
        if (available <= 0) return;
        event.preventDefault();
        s.selectedFeedType = 'slowness';
        setSelectedFeedType('slowness');
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    function processInput(s) {
      const clicks = s.clickQueue.splice(0);
      for (const click of clicks) {
        if (s.phase !== 'playing') continue;
        if (!s.ballTouched) continue;

        const requestedType = s.selectedFeedType || 'basic';
        const requestedDef = getFeedDef(requestedType);
        let typeToPlace = requestedType;

        if (requestedDef?.limited) {
          const deducted = feedInventoryDB.deductCount(requestedType, 1);
          if (!deducted) {
            typeToPlace = 'basic';
            s.selectedFeedType = 'basic';
            setSelectedFeedType('basic');
          } else {
            const updatedCount = feedInventoryDB.getCount(requestedType);
            s.feedCounts = { ...s.feedCounts, [requestedType]: updatedCount };
            setFeedCounts(s.feedCounts);
          }
        }

        const placed = s.feedManager.place(click.x, click.y, 'player', typeToPlace);
        if (!placed && typeToPlace !== 'basic') {
          const refundedCount = feedInventoryDB.addCount(typeToPlace, 1);
          s.feedCounts = { ...s.feedCounts, [typeToPlace]: refundedCount };
          setFeedCounts(s.feedCounts);
        }
      }
    }

    function update(dt, s) {
      // UI timers
      if (s.phase === 'playing') {
        s.gameTime -= dt;
        const nextDisplayedSecond = Math.max(0, Math.floor(s.gameTime));
        if (nextDisplayedSecond !== lastDisplayedSecond.current) {
          lastDisplayedSecond.current = nextDisplayedSecond;
          setDisplayTime(nextDisplayedSecond);
        }
        if (s.gameTime <= 0) {
          s.gameTime = 0;
          s.phase = 'gameover';
          setPhase('gameover');
          setDisplayTime(0);
          onMatchEnd?.({
            scores: { left: s.scoreLeft, right: s.scoreRight },
            matchup: s.matchup,
          });
          return;
        }
      }
      if (s.phase === 'goal') {
        s.goalTimer -= dt;
        if (s.goalTimer <= 0) {
          resetAfterGoal();
          s.phase = 'playing';
          setPhase('playing');
          setGoalMessage('');
        }
        return;
      }
      if (s.phase !== 'playing') return;

      s.ball.update(dt);
      for (const chicken of s.allChickens) {
        chicken.update(dt, s.ball, s.feedManager);
      }
      if (s.ball.wasKicked && !s.ballTouched) {
        s.ballTouched = true;
        setBallTouched(true);
      }
      s.feedManager.update(dt);

      // Goals
      if (isInLeftGoal(s.ball)) {
        s.scoreRight++;
        s.goalMessage = 'BLUE SCORES!';
        s.phase = 'goal';
        s.goalTimer = 2;
        for (const chicken of s.opponentChickens) {
          chicken.celebrate();
        }
        setScores({ left: s.scoreLeft, right: s.scoreRight });
        setGoalMessage(s.goalMessage);
        setPhase('goal');
      } else if (isInRightGoal(s.ball)) {
        s.scoreLeft++;
        s.goalMessage = 'RED SCORES!';
        s.phase = 'goal';
        s.goalTimer = 2;
        for (const chicken of s.playerChickens) {
          chicken.celebrate();
        }
        setScores({ left: s.scoreLeft, right: s.scoreRight });
        setGoalMessage(s.goalMessage);
        setPhase('goal');
      }
    }

    function draw(ctx, s) {
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      drawPitch(ctx);
      s.feedManager.draw(ctx);
      s.ball.draw(ctx);
      for (const chicken of s.allChickens) {
        chicken.draw(ctx);
      }
    }

    function loop(timestamp) {
      const s = gameState.current;
      const dt = Math.min((timestamp - s.lastTime) / 1000, 0.05);
      s.lastTime = timestamp;

      processInput(s);
      update(dt, s);
      draw(ctx, s);

      s.animFrameId = requestAnimationFrame(loop);
    }

    gameState.current.animFrameId = requestAnimationFrame((ts) => {
      gameState.current.lastTime = ts;
      loop(ts);
    });

    return () => {
      cancelAnimationFrame(gameState.current.animFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvasRef, handleCanvasClick, handleTouchEnd, onMatchEnd, resetAfterGoal, togglePause]);

  return {
    phase,
    scores,
    displayTime,
    goalMessage,
    matchup,
    ballTouched,
    selectedFeedType,
    feedCounts,
    togglePause,
    quitToMenu,
  };
}
