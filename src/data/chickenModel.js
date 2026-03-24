import { getDefaultStats, sanitizeStats, resolveStatsForGame } from './statDefs';

const CHICKEN_FIRST_NAMES = ['Clucky', 'Pecky', 'Nugget', 'Flap', 'Sunny', 'Rusty', 'Poppy'];
const CHICKEN_LAST_NAMES = ['Comet', 'Dash', 'Feather', 'Boots', 'Spark', 'Pepper', 'Wing'];

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChickenName() {
  return `${randomChoice(CHICKEN_FIRST_NAMES)} ${randomChoice(CHICKEN_LAST_NAMES)}`;
}

function getId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `chicken-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export function createChicken({ name, stats } = {}) {
  return normalizeChickenRecord({
    id: getId(),
    name: name || buildChickenName(),
    stats,
    createdAt: new Date().toISOString(),
  });
}

export function normalizeChickenRecord(chicken = {}) {
  return {
    id: chicken.id || getId(),
    name: chicken.name || buildChickenName(),
    stats: sanitizeStats(chicken.stats || getDefaultStats()),
    createdAt: chicken.createdAt || new Date().toISOString(),
  };
}

export function generateStarterChicken() {
  return createChicken({
    stats: {
      speed: randomInt(45, 55),
    },
  });
}

export function generateRandomOpponent() {
  return createChicken({
    stats: {
      speed: randomInt(35, 90),
    },
  });
}

export function generateRandomOpponents(count = 1) {
  const safeCount = Math.max(1, Math.floor(Number(count) || 1));
  return Array.from({ length: safeCount }, () => generateRandomOpponent());
}

export function resolveGameStats(chicken) {
  return resolveStatsForGame(chicken?.stats);
}
