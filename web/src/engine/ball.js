// Ball physics

import { PITCH } from './pitch.js';

export class Ball {
  constructor() {
    this.radius = 3;
    this.reset();
  }

  reset() {
    this.x = PITCH.x + PITCH.w / 2;
    this.y = PITCH.y + PITCH.h / 2;
    this.vx = 0;
    this.vy = 0;
    this.wasKicked = false;
  }

  update(dt) {
    const friction = 0.98;
    this.vx *= friction;
    this.vy *= friction;

    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    // Bounce off top/bottom
    if (this.y - this.radius < PITCH.y) {
      this.y = PITCH.y + this.radius;
      this.vy = Math.abs(this.vy) * 0.7;
    }
    if (this.y + this.radius > PITCH.y + PITCH.h) {
      this.y = PITCH.y + PITCH.h - this.radius;
      this.vy = -Math.abs(this.vy) * 0.7;
    }

    // Bounce off left/right (except goal openings)
    const inGoalY =
      this.y > PITCH.y + (PITCH.h - 40) / 2 &&
      this.y < PITCH.y + (PITCH.h + 40) / 2;

    if (this.x - this.radius < PITCH.x && !inGoalY) {
      this.x = PITCH.x + this.radius;
      this.vx = Math.abs(this.vx) * 0.7;
    }
    if (this.x + this.radius > PITCH.x + PITCH.w && !inGoalY) {
      this.x = PITCH.x + PITCH.w - this.radius;
      this.vx = -Math.abs(this.vx) * 0.7;
    }
  }

  kick(angle, power) {
    this.vx += Math.cos(angle) * power;
    this.vy += Math.sin(angle) * power;
    this.wasKicked = true;
  }

  draw(ctx) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(
      Math.floor(this.x - this.radius),
      Math.floor(this.y - this.radius + 2),
      this.radius * 2,
      this.radius * 2
    );

    // White ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(Math.floor(this.x), Math.floor(this.y), this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Pattern
    ctx.fillStyle = '#333333';
    ctx.fillRect(Math.floor(this.x) - 1, Math.floor(this.y) - 1, 2, 2);
  }
}
