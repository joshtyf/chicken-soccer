function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateMatchReward(scores = { left: 0, right: 0 }) {
  const playerGoals = Math.max(0, Math.floor(Number(scores.left) || 0));
  const opponentGoals = Math.max(0, Math.floor(Number(scores.right) || 0));
  const didWin = playerGoals > opponentGoals;

  const goalBonus = playerGoals * 5;
  const winBonus = didWin ? randomInt(0, 50) : 0;
  const total = winBonus + goalBonus;

  return {
    didWin,
    winBonus,
    goalBonus,
    total,
  };
}
