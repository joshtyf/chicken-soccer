export const FEED_TYPES = {
  basic: {
    key: 'basic',
    label: 'Basic Feed',
    description: 'Standard distraction feed. Unlimited during matches.',
    limited: false,
    price: null,
    effect: null,
  },
  slowness: {
    key: 'slowness',
    label: 'Slowness Feed',
    description: 'Slows the chicken that consumes it for 3 seconds.',
    limited: true,
    price: 2,
    effect: {
      type: 'slowness',
      speedMultiplier: 0.3,
      duration: 3,
    },
  },
};

export function getFeedDef(key) {
  return FEED_TYPES[key] || null;
}