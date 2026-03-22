// Chicken feed: placement, attraction, decay

import { PITCH } from './pitch.js';
import { clamp } from './utils.js';

const FEED_LIFETIME = 4;
const FEED_RADIUS = 30;
const MAX_FEED = 5;

export class FeedManager {
  constructor() {
    this.items = [];
  }

  place(x, y, player) {
    const count = this.items.filter((f) => f.player === player).length;
    if (count >= MAX_FEED) return false;

    const fx = clamp(x, PITCH.x + 2, PITCH.x + PITCH.w - 2);
    const fy = clamp(y, PITCH.y + 2, PITCH.y + PITCH.h - 2);

    this.items.push({
      x: fx,
      y: fy,
      player,
      timer: FEED_LIFETIME,
      radius: FEED_RADIUS,
    });
    return true;
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      this.items[i].timer -= dt;
      if (this.items[i].timer <= 0) {
        this.items.splice(i, 1);
      }
    }
  }

  getClosestFeed(pos) {
    let closest = null;
    let bestDist = Infinity;
    for (const feed of this.items) {
      const dx = feed.x - pos.x;
      const dy = feed.y - pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < feed.radius && d < bestDist) {
        bestDist = d;
        closest = feed;
      }
    }
    return closest;
  }

  consume(feed) {
    const idx = this.items.indexOf(feed);
    if (idx !== -1) this.items.splice(idx, 1);
  }

  draw(ctx) {
    for (const feed of this.items) {
      const alpha = Math.min(1, feed.timer / 0.5);
      const px = Math.floor(feed.x);
      const py = Math.floor(feed.y);

      // Attraction radius indicator
      ctx.strokeStyle = `rgba(255,200,50,${alpha * 0.15})`;
      ctx.beginPath();
      ctx.arc(px, py, feed.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Feed particles
      ctx.fillStyle = `rgba(218,165,32,${alpha})`;
      ctx.fillRect(px - 2, py - 1, 2, 1);
      ctx.fillRect(px + 1, py, 1, 1);
      ctx.fillRect(px - 1, py + 1, 1, 1);
      ctx.fillRect(px, py - 2, 1, 1);
      ctx.fillRect(px + 2, py + 1, 1, 1);

      // Timer bar
      const barW = 8;
      const pct = feed.timer / FEED_LIFETIME;
      ctx.fillStyle = `rgba(100,100,100,${alpha * 0.5})`;
      ctx.fillRect(px - barW / 2, py - 6, barW, 2);
      ctx.fillStyle = `rgba(255,200,50,${alpha})`;
      ctx.fillRect(px - barW / 2, py - 6, barW * pct, 2);
    }
  }

  reset() {
    this.items = [];
  }
}
