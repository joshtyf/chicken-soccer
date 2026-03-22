// Pitch rendering and goal constants

export const WORLD_W = 320;
export const WORLD_H = 180;

export const PITCH = {
  x: 20,
  y: 20,
  w: 280,
  h: 140,
};

export const GOAL_W = 6;
export const GOAL_H = 40;
export const GOAL_TOP = PITCH.y + (PITCH.h - GOAL_H) / 2;
export const GOAL_BOT = GOAL_TOP + GOAL_H;

export const LEFT_GOAL = {
  x: PITCH.x - GOAL_W,
  y: GOAL_TOP,
  w: GOAL_W,
  h: GOAL_H,
};

export const RIGHT_GOAL = {
  x: PITCH.x + PITCH.w,
  y: GOAL_TOP,
  w: GOAL_W,
  h: GOAL_H,
};

const LINE_COLOR = '#ffffff';
const GRASS_COLOR = '#2d8a4e';
const DARK_GRASS = '#267a43';
const GOAL_COLOR_LEFT = '#e74c3c';
const GOAL_COLOR_RIGHT = '#3498db';

export function drawPitch(ctx) {
  // Background
  ctx.fillStyle = '#1a3a2a';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Grass stripes
  for (let row = 0; row < PITCH.h; row += 10) {
    ctx.fillStyle = row % 20 === 0 ? GRASS_COLOR : DARK_GRASS;
    ctx.fillRect(PITCH.x, PITCH.y + row, PITCH.w, 10);
  }

  // Pitch border
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(PITCH.x, PITCH.y, PITCH.w, PITCH.h);

  // Center line
  const cx = PITCH.x + PITCH.w / 2;
  ctx.beginPath();
  ctx.moveTo(cx, PITCH.y);
  ctx.lineTo(cx, PITCH.y + PITCH.h);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, PITCH.y + PITCH.h / 2, 20, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = LINE_COLOR;
  ctx.fillRect(cx - 1, PITCH.y + PITCH.h / 2 - 1, 2, 2);

  // Goals
  ctx.fillStyle = GOAL_COLOR_LEFT;
  ctx.fillRect(LEFT_GOAL.x, LEFT_GOAL.y, LEFT_GOAL.w, LEFT_GOAL.h);
  ctx.strokeStyle = '#c0392b';
  ctx.strokeRect(LEFT_GOAL.x, LEFT_GOAL.y, LEFT_GOAL.w, LEFT_GOAL.h);

  ctx.fillStyle = GOAL_COLOR_RIGHT;
  ctx.fillRect(RIGHT_GOAL.x, RIGHT_GOAL.y, RIGHT_GOAL.w, RIGHT_GOAL.h);
  ctx.strokeStyle = '#2980b9';
  ctx.strokeRect(RIGHT_GOAL.x, RIGHT_GOAL.y, RIGHT_GOAL.w, RIGHT_GOAL.h);

  // Penalty areas
  const paW = 36;
  const paH = 60;
  const paY = PITCH.y + (PITCH.h - paH) / 2;
  ctx.strokeStyle = LINE_COLOR;
  ctx.strokeRect(PITCH.x, paY, paW, paH);
  ctx.strokeRect(PITCH.x + PITCH.w - paW, paY, paW, paH);
}

export function isInLeftGoal(ball) {
  return (
    ball.x - ball.radius <= LEFT_GOAL.x + LEFT_GOAL.w &&
    ball.y >= LEFT_GOAL.y &&
    ball.y <= LEFT_GOAL.y + LEFT_GOAL.h
  );
}

export function isInRightGoal(ball) {
  return (
    ball.x + ball.radius >= RIGHT_GOAL.x &&
    ball.y >= RIGHT_GOAL.y &&
    ball.y <= RIGHT_GOAL.y + RIGHT_GOAL.h
  );
}
