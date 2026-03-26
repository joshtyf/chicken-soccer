export const GAME_MODES = {
  SOLO: {
    id: 'solo',
    label: '1v1',
    description: 'Pick one chicken and face one random CPU chicken.',
    chickensPerTeam: 1,
  },
  DUO: {
    id: 'duo',
    label: '2v2',
    description: 'Pick two chickens and face two random CPU chickens.',
    chickensPerTeam: 2,
  },
};

export const DEFAULT_GAME_MODE = GAME_MODES.SOLO;

export function getGameModeById(modeId) {
  return Object.values(GAME_MODES).find((mode) => mode.id === modeId) || DEFAULT_GAME_MODE;
}
