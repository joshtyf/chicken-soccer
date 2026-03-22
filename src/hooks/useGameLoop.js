// Custom hook that runs the Canvas game loop via requestAnimationFrame

import { useRef, useEffect, useCallback, useState } from 'react';
import { WORLD_W, WORLD_H, PITCH, drawPitch, isInLeftGoal, isInRightGoal } from '../engine/pitch';
import { Ball } from '../engine/ball';
import { Chicken } from '../engine/chicken';
import { FeedManager } from '../engine/feed';
import { generateRandomOpponent, generateStarterChicken, resolveGameStats } from '../data/chickenModel';

const GAME_DURATION = 90;

export function useGameLoop(canvasRef) {
  const [phase, setPhase] = useState('menu');
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [displayTime, setDisplayTime] = useState(GAME_DURATION);
  const [goalMessage, setGoalMessage] = useState('');
  const [matchup, setMatchup] = useState({ playerChicken: null, opponentChicken: null });
  const lastDisplayedSecond = useRef(GAME_DURATION);

  const gameState = useRef({
    ball: new Ball(),
    chickenLeft: new Chicken('left', PITCH.x + 40, PITCH.y + PITCH.h / 2),
    chickenRight: new Chicken('right', PITCH.x + PITCH.w - 40, PITCH.y + PITCH.h / 2),
    feedManager: new FeedManager(),
    playerChicken: null,
    opponentChicken: null,
    scoreLeft: 0,
    scoreRight: 0,
    gameTime: GAME_DURATION,
    phase: 'menu', // 'menu' | 'playing' | 'goal' | 'gameover'
    goalTimer: 0,
    goalMessage: '',
    lastTime: 0,
    animFrameId: null,
    clickQueue: [],
  });

  const setupMatchup = useCallback((playerChickenInput) => {
    const s = gameState.current;

    const playerChicken = playerChickenInput || generateStarterChicken();
    const opponentChicken = generateRandomOpponent();

    s.playerChicken = playerChicken;
    s.opponentChicken = opponentChicken;

    s.chickenLeft = new Chicken(
      'left',
      PITCH.x + 40,
      PITCH.y + PITCH.h / 2,
      resolveGameStats(playerChicken)
    );

    s.chickenRight = new Chicken(
      'right',
      PITCH.x + PITCH.w - 40,
      PITCH.y + PITCH.h / 2,
      resolveGameStats(opponentChicken)
    );

    setMatchup({ playerChicken, opponentChicken });
  }, []);

  const resetAfterGoal = useCallback(() => {
    const s = gameState.current;
    s.ball.reset();
    s.chickenLeft.resetPosition();
    s.chickenRight.resetPosition();
    s.feedManager.reset();
  }, []);

  const resetMatch = useCallback((nextPhase) => {
    const s = gameState.current;
    s.phase = nextPhase;
    s.scoreLeft = 0;
    s.scoreRight = 0;
    s.gameTime = GAME_DURATION;
    s.goalTimer = 0;
    s.goalMessage = '';
    s.feedManager.reset();
    s.ball.reset();
    s.chickenLeft.resetPosition();
    s.chickenRight.resetPosition();

    lastDisplayedSecond.current = GAME_DURATION;
    setPhase(nextPhase);
    setScores({ left: 0, right: 0 });
    setDisplayTime(GAME_DURATION);
    setGoalMessage('');
  }, []);

  const startGame = useCallback((playerChicken) => {
    setupMatchup(playerChicken);
    resetMatch('playing');
  }, [resetMatch, setupMatchup]);

  const restartGame = useCallback(() => {
    resetMatch('menu');
  }, [resetMatch]);

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

    function processInput(s) {
      const clicks = s.clickQueue.splice(0);
      for (const click of clicks) {
        if (s.phase === 'playing') {
          s.feedManager.place(click.x, click.y, 'player');
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
          return;
        }
      }
      if (s.phase === 'goal') {
        s.goalTimer -= dt;
        if (s.goalTimer <= 0) {
          s.phase = 'playing';
          setPhase('playing');
        }
        return;
      }
      if (s.phase !== 'playing') return;

      s.ball.update(dt);
      s.chickenLeft.update(dt, s.ball, s.feedManager);
      s.chickenRight.update(dt, s.ball, s.feedManager);
      s.feedManager.update(dt);

      // Goals
      if (isInLeftGoal(s.ball)) {
        s.scoreRight++;
        s.goalMessage = 'BLUE SCORES!';
        s.phase = 'goal';
        s.goalTimer = 2;
        s.chickenRight.celebrate();
        setScores({ left: s.scoreLeft, right: s.scoreRight });
        setGoalMessage(s.goalMessage);
        setPhase('goal');
        setTimeout(resetAfterGoal, 1500);
      } else if (isInRightGoal(s.ball)) {
        s.scoreLeft++;
        s.goalMessage = 'RED SCORES!';
        s.phase = 'goal';
        s.goalTimer = 2;
        s.chickenLeft.celebrate();
        setScores({ left: s.scoreLeft, right: s.scoreRight });
        setGoalMessage(s.goalMessage);
        setPhase('goal');
        setTimeout(resetAfterGoal, 1500);
      }

      // Push chickens apart
      const dx = s.chickenRight.x - s.chickenLeft.x;
      const dy = s.chickenRight.y - s.chickenLeft.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < s.chickenLeft.radius + s.chickenRight.radius && d > 0) {
        const overlap = (s.chickenLeft.radius + s.chickenRight.radius - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        s.chickenLeft.x -= nx * overlap;
        s.chickenLeft.y -= ny * overlap;
        s.chickenRight.x += nx * overlap;
        s.chickenRight.y += ny * overlap;
      }
    }

    function draw(ctx, s) {
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      drawPitch(ctx);
      s.feedManager.draw(ctx);
      s.ball.draw(ctx);
      s.chickenLeft.draw(ctx);
      s.chickenRight.draw(ctx);
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
    };
  }, [canvasRef, handleCanvasClick, handleTouchEnd, resetAfterGoal]);

  return {
    phase,
    scores,
    displayTime,
    goalMessage,
    matchup,
    startGame,
    restartGame,
  };
}
