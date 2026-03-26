const SPEED_MIN_GAME_VALUE = 30;
const SPEED_MAX_GAME_VALUE = 80;

function clampStatValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toGameSpeed(value) {
  const normalized = clampStatValue(value, 0, 100) / 100;
  return SPEED_MIN_GAME_VALUE + (SPEED_MAX_GAME_VALUE - SPEED_MIN_GAME_VALUE) * normalized;
}

export const STAT_DEFS = {
  speed: {
    key: 'speed',
    label: 'Speed',
    min: 0,
    max: 100,
    default: 50,
    toGameValue: toGameSpeed,
  },
};

export function getDefaultStats() {
  return Object.fromEntries(
    Object.entries(STAT_DEFS).map(([key, def]) => [key, def.default])
  );
}

export function sanitizeStats(stats = {}) {
  const baseStats = getDefaultStats();

  for (const [key, def] of Object.entries(STAT_DEFS)) {
    const rawValue = Number(stats[key]);
    if (!Number.isFinite(rawValue)) continue;

    baseStats[key] = clampStatValue(rawValue, def.min, def.max);
  }

  return baseStats;
}

export function resolveStatsForGame(stats = {}) {
  const safeStats = sanitizeStats(stats);

  return Object.fromEntries(
    Object.entries(STAT_DEFS).map(([key, def]) => [key, def.toGameValue(safeStats[key])])
  );
}
