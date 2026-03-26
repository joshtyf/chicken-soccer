import { useCallback, useEffect, useRef, useState } from 'react';
import { WORLD_W, WORLD_H, drawPitch } from '../engine/pitch';
import { createGameSocket, sendSocketMessage } from '../services/wsClient';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function drawBall(ctx, ball) {
  if (!ball) return;
  const radius = ball.radius || 3;
  const x = Math.floor(ball.x || 0);
  const y = Math.floor(ball.y || 0);

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(Math.floor(x - radius), Math.floor(y - radius + 2), radius * 2, radius * 2);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#333333';
  ctx.fillRect(x - 1, y - 1, 2, 2);
}

function drawFeed(ctx, feedItems = []) {
  for (const feed of feedItems) {
    const alpha = Math.min(1, (feed.timer || 0) / 0.5);
    const px = Math.floor(feed.x || 0);
    const py = Math.floor(feed.y || 0);
    const isSlowness = feed.type === 'slowness';
    const radius = feed.radius || 30;

    const radiusColor = isSlowness ? `rgba(100,180,255,${alpha * 0.18})` : `rgba(255,200,50,${alpha * 0.15})`;
    const feedColor = isSlowness ? `rgba(130,200,255,${alpha})` : `rgba(218,165,32,${alpha})`;
    const timerColor = isSlowness ? `rgba(130,200,255,${alpha})` : `rgba(255,200,50,${alpha})`;

    ctx.strokeStyle = radiusColor;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = feedColor;
    ctx.fillRect(px - 2, py - 1, 2, 1);
    ctx.fillRect(px + 1, py, 1, 1);
    ctx.fillRect(px - 1, py + 1, 1, 1);
    ctx.fillRect(px, py - 2, 1, 1);
    ctx.fillRect(px + 2, py + 1, 1, 1);

    const barW = 8;
    const pct = (feed.timer || 0) / 4;
    ctx.fillStyle = `rgba(100,100,100,${alpha * 0.5})`;
    ctx.fillRect(px - barW / 2, py - 6, barW, 2);
    ctx.fillStyle = timerColor;
    ctx.fillRect(px - barW / 2, py - 6, barW * pct, 2);
  }
}

function drawChicken(ctx, chicken, nowSeconds) {
  if (!chicken) return;

  const x = chicken.x || 0;
  const y = chicken.y || 0;
  const vx = chicken.vx || 0;
  const facing = vx >= 0 ? 1 : -1;
  const bobble = Math.sin(nowSeconds * 8) * 0.5;

  const px = Math.floor(x);
  const py = Math.floor(y + bobble);

  const isLeft = chicken.team === 'left';
  const bodyColor = isLeft ? '#e74c3c' : '#3498db';
  const darkColor = isLeft ? '#c0392b' : '#2980b9';

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(px - 4, py + 4, 8, 3);

  const footOffset = Math.sin(nowSeconds * 10) * 1.5;
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(px - 2 + (facing > 0 ? 0 : -1), py + 3 + Math.floor(footOffset), 2, 2);
  ctx.fillRect(px + 1 + (facing > 0 ? 0 : -1), py + 3 - Math.floor(footOffset), 2, 2);

  ctx.fillStyle = '#ffeaa7';
  ctx.fillRect(px - 3, py - 2, 6, 6);

  ctx.fillStyle = bodyColor;
  ctx.fillRect(px - 3, py - 1, 6, 3);

  ctx.fillStyle = darkColor;
  ctx.fillRect(px + (facing > 0 ? -4 : 3), py - 1, 2, 3);

  ctx.fillStyle = '#ffeaa7';
  ctx.fillRect(px + (facing > 0 ? 2 : -4), py - 4, 3, 3);

  ctx.fillStyle = '#2d3436';
  const headX = px + (facing > 0 ? 3 : -3);
  ctx.fillRect(headX, py - 3, 1, 1);

  ctx.fillStyle = '#e67e22';
  const beakX = facing > 0 ? headX + 1 : headX - 1;
  ctx.fillRect(beakX, py - 2, 1, 1);

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(px + (facing > 0 ? 2 : -3), py - 5, 2, 2);

  if ((chicken.slowTimer || 0) > 0) {
    ctx.fillStyle = '#74c8ff';
    ctx.fillRect(px - 2, py - 7, 1, 1);
    ctx.fillRect(px, py - 8, 1, 1);
    ctx.fillRect(px + 2, py - 7, 1, 1);
  }

  if ((chicken.appetiteCooldown || 0) > 0) {
    ctx.fillStyle = '#8be26a';
    ctx.fillRect(px - 2, py - 10, 1, 1);
    ctx.fillRect(px - 1, py - 11, 3, 1);
    ctx.fillRect(px + 2, py - 10, 1, 1);
  }

  ctx.fillStyle = '#ffeaa7';
  ctx.fillRect(px + (facing > 0 ? -4 : 3), py - 3, 1, 2);
}

function interpolateState(previousSnapshot, latestSnapshot) {
  if (!latestSnapshot) return null;
  if (!previousSnapshot) return latestSnapshot.state;

  const elapsed = performance.now() - latestSnapshot.receivedAt;
  const alpha = clamp(elapsed / 50, 0, 1);

  const prevBall = previousSnapshot.state.ball || {};
  const nextBall = latestSnapshot.state.ball || {};
  const ball = {
    ...nextBall,
    x: lerp(prevBall.x || nextBall.x || 0, nextBall.x || 0, alpha),
    y: lerp(prevBall.y || nextBall.y || 0, nextBall.y || 0, alpha),
  };

  const prevChickens = previousSnapshot.state.chickens || [];
  const nextChickens = latestSnapshot.state.chickens || [];
  const prevById = new Map(prevChickens.map((chicken) => [chicken.id, chicken]));
  const chickens = nextChickens.map((chicken) => {
    const prevChicken = prevById.get(chicken.id) || chicken;
    return {
      ...chicken,
      x: lerp(prevChicken.x || chicken.x || 0, chicken.x || 0, alpha),
      y: lerp(prevChicken.y || chicken.y || 0, chicken.y || 0, alpha),
    };
  });

  return {
    ...latestSnapshot.state,
    ball,
    chickens,
  };
}

export function useGameLoop(canvasRef, { matchup, onMatchEnd, onQuit } = {}) {
  const [phase, setPhase] = useState('playing');
  const [scores, setScores] = useState({ left: 0, right: 0 });
  const [displayTime, setDisplayTime] = useState(90);
  const [goalMessage, setGoalMessage] = useState('');
  const [ballTouched, setBallTouched] = useState(false);
  const [selectedFeedType, setSelectedFeedType] = useState('basic');
  const [feedCounts, setFeedCounts] = useState(matchup?.feedInventory || { slowness: 0 });
  const [resolvedMatchup, setResolvedMatchup] = useState(matchup || null);

  const wsRef = useRef(null);
  const snapshotRef = useRef({ previous: null, latest: null });
  const animRef = useRef(null);
  const latestMatchupRef = useRef(matchup || null);

  useEffect(() => {
    latestMatchupRef.current = matchup || null;
    setResolvedMatchup(matchup || null);
    setFeedCounts(matchup?.feedInventory || { slowness: 0 });
    setSelectedFeedType('basic');
    setBallTouched(false);
    setGoalMessage('');
    setScores({ left: 0, right: 0 });
    setDisplayTime(90);
    setPhase('playing');
    snapshotRef.current = { previous: null, latest: null };
  }, [matchup]);

  const send = useCallback((payload) => {
    sendSocketMessage(wsRef.current, payload);
  }, []);

  const togglePause = useCallback(() => {
    setPhase((current) => {
      if (current === 'paused') {
        send({ type: 'resume' });
        return 'playing';
      }

      if (current === 'playing' || current === 'goal') {
        send({ type: 'pause' });
        return 'paused';
      }

      return current;
    });
  }, [send]);

  const quitToMenu = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    onQuit?.();
  }, [onQuit]);

  useEffect(() => {
    const sessionId = matchup?.sessionId;
    if (!sessionId) return undefined;

    let closedByCleanup = false;

    createGameSocket(sessionId, {
      onOpen: () => {
        send({ type: 'feed_select', feedType: 'basic' });
      },
      onMessage: (message) => {
        if (message.type === 'match_start') {
          setResolvedMatchup(message.matchup || matchup);
          if (message.feedInventory) {
            setFeedCounts(message.feedInventory);
          }
          if (typeof message.ballTouched === 'boolean') {
            setBallTouched(message.ballTouched);
          }
          return;
        }

        if (message.type === 'state') {
          const previous = snapshotRef.current.latest;
          const latest = {
            receivedAt: performance.now(),
            state: message,
          };
          snapshotRef.current = { previous, latest };

          setScores(message.scores || { left: 0, right: 0 });
          setDisplayTime(Math.max(0, Math.floor(message.time || 0)));
          setPhase(message.phase || 'playing');
          setFeedCounts(message.feedInventory || { slowness: 0 });

          if (typeof message.ballTouched === 'boolean') {
            setBallTouched(message.ballTouched);
          } else {
            const movingBall = Math.abs(message?.ball?.vx || 0) + Math.abs(message?.ball?.vy || 0) > 0.05;
            if (movingBall) {
              setBallTouched(true);
            }
          }
          return;
        }

        if (message.type === 'goal') {
          setGoalMessage(message.message || 'GOAL!');
          setScores(message.scores || { left: 0, right: 0 });
          setPhase('goal');
          return;
        }

        if (message.type === 'match_end') {
          setScores(message.scores || { left: 0, right: 0 });
          setPhase('gameover');
          onMatchEnd?.({
            scores: message.scores || { left: 0, right: 0 },
            matchup: latestMatchupRef.current,
            reward: message.reward || null,
          });
          return;
        }

        if (message.type === 'error') {
          console.error(message.message || 'WebSocket error');
          onQuit?.();
        }
      },
      onClose: () => {
        if (!closedByCleanup) {
          onQuit?.();
        }
      },
      onError: (error) => {
        console.error(error);
      },
    }).then((ws) => {
      wsRef.current = ws;
    }).catch((error) => {
      console.error(error);
      onQuit?.();
    });

    return () => {
      closedByCleanup = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [matchup, onMatchEnd, onQuit, send]);

  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas || !ballTouched || phase !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    send({ type: 'feed_place', x, y, feedType: selectedFeedType });
  }, [ballTouched, canvasRef, phase, selectedFeedType, send]);

  const handleTouchEnd = useCallback((event) => {
    event.preventDefault();
    if (event.changedTouches.length === 0) return;

    const touch = event.changedTouches[0];
    const canvas = canvasRef.current;
    if (!canvas || !ballTouched || phase !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = WORLD_W / rect.width;
    const scaleY = WORLD_H / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    send({ type: 'feed_place', x, y, feedType: selectedFeedType });
  }, [ballTouched, canvasRef, phase, selectedFeedType, send]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        togglePause();
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        setSelectedFeedType('basic');
        send({ type: 'feed_select', feedType: 'basic' });
        return;
      }

      if (event.key === '2') {
        if ((feedCounts?.slowness || 0) <= 0) return;
        event.preventDefault();
        setSelectedFeedType('slowness');
        send({ type: 'feed_select', feedType: 'slowness' });
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [feedCounts, send, togglePause]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    canvas.width = WORLD_W;
    canvas.height = WORLD_H;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    function draw() {
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      drawPitch(ctx);

      const interpolated = interpolateState(snapshotRef.current.previous, snapshotRef.current.latest);
      if (interpolated) {
        drawFeed(ctx, interpolated.feed || []);
        drawBall(ctx, interpolated.ball || null);

        const nowSeconds = performance.now() / 1000;
        for (const chicken of interpolated.chickens || []) {
          drawChicken(ctx, chicken, nowSeconds);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasRef, handleCanvasClick, handleTouchEnd]);

  return {
    phase,
    scores,
    displayTime,
    goalMessage,
    matchup: resolvedMatchup,
    ballTouched,
    selectedFeedType,
    feedCounts,
    togglePause,
    quitToMenu,
  };
}
