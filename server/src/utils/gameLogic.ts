export interface DominoTile {
  left: number;
  right: number;
  id: string;
}

export interface GameState {
  board: DominoTile[];
  boardLeftEnd: number;
  boardRightEnd: number;
  boneyard: DominoTile[];
  players: PlayerState[];
  currentPlayerIndex: number;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  totalMoves: number;
  startTime: number;
}

export interface PlayerState {
  id: string;
  username: string;
  hand: DominoTile[];
  isConnected: boolean;
  passCount: number;
}

export function generateDominoes(): DominoTile[] {
  const tiles: DominoTile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push({ left: i, right: j, id: `${i}-${j}` });
    }
  }
  return shuffleArray(tiles);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createInitialGameState(players: { id: string; username: string }[]): GameState {
  const allTiles = generateDominoes();
  const tilesPerPlayer = players.length === 2 ? 7 : 5;
  const playerStates: PlayerState[] = players.map((p, idx) => ({
    id: p.id,
    username: p.username,
    hand: allTiles.slice(idx * tilesPerPlayer, (idx + 1) * tilesPerPlayer),
    isConnected: true,
    passCount: 0,
  }));
  const boneyard = allTiles.slice(players.length * tilesPerPlayer);

  // Find who has double-6, or highest double, or just start with player 0
  let startingPlayerIndex = 0;
  let highestDouble = -1;
  playerStates.forEach((ps, idx) => {
    ps.hand.forEach((tile) => {
      if (tile.left === tile.right && tile.left > highestDouble) {
        highestDouble = tile.left;
        startingPlayerIndex = idx;
      }
    });
  });

  return {
    board: [],
    boardLeftEnd: -1,
    boardRightEnd: -1,
    boneyard,
    players: playerStates,
    currentPlayerIndex: startingPlayerIndex,
    status: 'playing',
    winner: null,
    totalMoves: 0,
    startTime: Date.now(),
  };
}

export type PlaceSide = 'left' | 'right';

export interface MoveResult {
  valid: boolean;
  message?: string;
  newState?: GameState;
}

export function canPlayTile(tile: DominoTile, state: GameState): boolean {
  if (state.board.length === 0) return true;
  return (
    tile.left === state.boardLeftEnd ||
    tile.right === state.boardLeftEnd ||
    tile.left === state.boardRightEnd ||
    tile.right === state.boardRightEnd
  );
}

export function applyMove(
  state: GameState,
  playerId: string,
  tileId: string,
  side: PlaceSide
): MoveResult {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { valid: false, message: 'Player not found' };
  if (playerIndex !== state.currentPlayerIndex)
    return { valid: false, message: 'Not your turn' };

  const player = state.players[playerIndex];
  const tileIndex = player.hand.findIndex((t) => t.id === tileId);
  if (tileIndex === -1) return { valid: false, message: 'Tile not in hand' };

  const tile = player.hand[tileIndex];
  const newState: GameState = JSON.parse(JSON.stringify(state));
  const newPlayer = newState.players[playerIndex];

  if (newState.board.length === 0) {
    // First move
    newState.board.push(tile);
    newState.boardLeftEnd = tile.left;
    newState.boardRightEnd = tile.right;
  } else {
    if (side === 'left') {
      if (tile.right === newState.boardLeftEnd) {
        newState.board.unshift(tile);
        newState.boardLeftEnd = tile.left;
      } else if (tile.left === newState.boardLeftEnd) {
        const flipped: DominoTile = { left: tile.right, right: tile.left, id: tile.id };
        newState.board.unshift(flipped);
        newState.boardLeftEnd = flipped.left;
      } else {
        return { valid: false, message: 'Tile does not fit on the left' };
      }
    } else {
      if (tile.left === newState.boardRightEnd) {
        newState.board.push(tile);
        newState.boardRightEnd = tile.right;
      } else if (tile.right === newState.boardRightEnd) {
        const flipped: DominoTile = { left: tile.right, right: tile.left, id: tile.id };
        newState.board.push(flipped);
        newState.boardRightEnd = flipped.right;
      } else {
        return { valid: false, message: 'Tile does not fit on the right' };
      }
    }
  }

  newPlayer.hand.splice(tileIndex, 1);
  newPlayer.passCount = 0;
  newState.totalMoves += 1;

  // Check win: player emptied hand
  if (newPlayer.hand.length === 0) {
    newState.status = 'finished';
    newState.winner = playerId;
    return { valid: true, newState };
  }

  newState.currentPlayerIndex = (playerIndex + 1) % newState.players.length;
  return { valid: true, newState };
}

export function applyDraw(state: GameState, playerId: string): MoveResult {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex)
    return { valid: false, message: 'Not your turn' };
  if (state.boneyard.length === 0)
    return { valid: false, message: 'Boneyard is empty' };

  const newState: GameState = JSON.parse(JSON.stringify(state));
  const drawn = newState.boneyard.pop()!;
  newState.players[playerIndex].hand.push(drawn);
  return { valid: true, newState };
}

export function applyPass(state: GameState, playerId: string): MoveResult {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex !== state.currentPlayerIndex)
    return { valid: false, message: 'Not your turn' };

  const newState: GameState = JSON.parse(JSON.stringify(state));
  newState.players[playerIndex].passCount += 1;

  // All players passed consecutively → game is blocked, find winner by lowest pip count
  const allPassed = newState.players.every((p) => p.passCount >= 1);
  if (allPassed) {
    newState.status = 'finished';
    let minPips = Infinity;
    let winnerId = newState.players[0].id;
    newState.players.forEach((p) => {
      const pips = p.hand.reduce((sum, t) => sum + t.left + t.right, 0);
      if (pips < minPips) {
        minPips = pips;
        winnerId = p.id;
      }
    });
    newState.winner = winnerId;
    return { valid: true, newState };
  }

  newState.currentPlayerIndex = (playerIndex + 1) % newState.players.length;
  return { valid: true, newState };
}

export function getPlayableOptions(state: GameState, playerId: string): { canPlay: boolean; canDraw: boolean } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { canPlay: false, canDraw: false };
  const canPlay = player.hand.some((t) => canPlayTile(t, state));
  return { canPlay, canDraw: state.boneyard.length > 0 };
}
