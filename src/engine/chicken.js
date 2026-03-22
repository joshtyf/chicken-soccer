// Chicken entity: AI movement, feed distraction, pixel-art rendering

import { PITCH } from './pitch.js';
import { dist, angleBetween, clamp, randomRange } from './utils.js';

const CHICKEN_RADIUS = 5;
const CHICKEN_SPEED = 50;
const KICK_RANGE = 8;
const KICK_POWER = 2.5;
const EAT_RANGE = 5;
const DISTRACTION_WEIGHT = 0.7;

const STATE_CHASE_BALL = 'chase';
const STATE_DISTRACTED = 'distracted';
const STATE_CELEBRATE = 'celebrate';
const STATE_IDLE = 'idle';

export class Chicken {
  constructor(team, startX, startY) {
    this.team = team;
    this.homeX = startX;
    this.homeY = startY;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.radius = CHICKEN_RADIUS;
    this.state = STATE_IDLE;
    this.facing = team === 'left' ? 1 : -1;
    this.animTimer = 0;
    this.bobble = 0;
    this.pecking = false;
    this.peckTimer = 0;
  }

  update(dt, ball, feedManager) {
    this.animTimer += dt;
    this.bobble = Math.sin(this.animTimer * 8) * 0.5;

    const nearestFeed = feedManager.getClosestFeed(this);

    if (this.state === STATE_CELEBRATE) {
      this.vx = Math.sin(this.animTimer * 15) * 20;
      this.vy = Math.cos(this.animTimer * 12) * 10;
    } else if (nearestFeed) {
      this.state = STATE_DISTRACTED;
      const angle = angleBetween(this, nearestFeed);
      this.vx = Math.cos(angle) * CHICKEN_SPEED * DISTRACTION_WEIGHT;
      this.vy = Math.sin(angle) * CHICKEN_SPEED * DISTRACTION_WEIGHT;
      this.facing = this.vx > 0 ? 1 : -1;

      if (dist(this, nearestFeed) < EAT_RANGE) {
        feedManager.consume(nearestFeed);
        this.pecking = true;
        this.peckTimer = 0.3;
      }
    } else {
      this.state = STATE_CHASE_BALL;
      let targetX = ball.x;
      let targetY = ball.y;

      if (this.team === 'left') {
        targetX = Math.min(targetX, PITCH.x + PITCH.w * 0.75);
      } else {
        targetX = Math.max(targetX, PITCH.x + PITCH.w * 0.25);
      }

      const toTarget = angleBetween(this, { x: targetX, y: targetY });
      this.vx = Math.cos(toTarget) * CHICKEN_SPEED;
      this.vy = Math.sin(toTarget) * CHICKEN_SPEED;
      this.facing = this.vx > 0 ? 1 : -1;
    }

    if (this.pecking) {
      this.peckTimer -= dt;
      if (this.peckTimer <= 0) this.pecking = false;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = clamp(this.x, PITCH.x + this.radius, PITCH.x + PITCH.w - this.radius);
    this.y = clamp(this.y, PITCH.y + this.radius, PITCH.y + PITCH.h - this.radius);

    if (dist(this, ball) < KICK_RANGE && this.state !== STATE_CELEBRATE) {
      const kickAngle = angleBetween(this, ball);
      const spread = randomRange(-0.3, 0.3);
      ball.kick(kickAngle + spread, KICK_POWER);
    }
  }

  celebrate() {
    this.state = STATE_CELEBRATE;
    setTimeout(() => {
      this.state = STATE_IDLE;
    }, 1500);
  }

  resetPosition() {
    this.x = this.homeX;
    this.y = this.homeY;
    this.vx = 0;
    this.vy = 0;
    this.state = STATE_IDLE;
  }

  draw(ctx) {
    const px = Math.floor(this.x);
    const py = Math.floor(this.y + this.bobble);
    const f = this.facing;

    const isLeft = this.team === 'left';
    const bodyColor = isLeft ? '#e74c3c' : '#3498db';
    const darkColor = isLeft ? '#c0392b' : '#2980b9';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(px - 4, py + 4, 8, 3);

    // Feet
    const footOffset = Math.sin(this.animTimer * 10) * 1.5;
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(px - 2 + (f > 0 ? 0 : -1), py + 3 + Math.floor(footOffset), 2, 2);
    ctx.fillRect(px + 1 + (f > 0 ? 0 : -1), py + 3 - Math.floor(footOffset), 2, 2);

    // Body
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(px - 3, py - 2, 6, 6);

    // Jersey
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px - 3, py - 1, 6, 3);

    // Wing
    ctx.fillStyle = darkColor;
    ctx.fillRect(px + (f > 0 ? -4 : 3), py - 1, 2, 3);

    // Head
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(px + (f > 0 ? 2 : -4), py - 4, 3, 3);

    // Eye
    ctx.fillStyle = '#2d3436';
    const headX = px + (f > 0 ? 3 : -3);
    ctx.fillRect(headX, py - 3, 1, 1);

    // Beak
    ctx.fillStyle = '#e67e22';
    const beakX = f > 0 ? headX + 1 : headX - 1;
    const beakY = this.pecking ? py - 1 : py - 2;
    ctx.fillRect(beakX, beakY, 1, 1);

    // Comb
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px + (f > 0 ? 2 : -3), py - 5, 2, 2);

    // Tail
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(px + (f > 0 ? -4 : 3), py - 3, 1, 2);
  }
}
