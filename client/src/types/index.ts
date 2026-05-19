export interface DominoTile {
  left: number;
  right: number;
  id: string;
}

export interface PlayerState {
  id: string;
  username: string;
  hand: DominoTile[];
  isConnected: boolean;
  passCount: number;
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

export interface RoomInfo {
  code: string;
  hostId: string;
  players: Array<{ id: string; username: string }>;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface User {
  id: string;
  username: string;
  email: string;
  gamesPlayed: number;
  gamesWon: number;
}

export interface LastAction {
  type: 'play' | 'draw' | 'pass';
  playerId: string;
  username: string;
  tileId?: string;
  side?: 'left' | 'right';
}
