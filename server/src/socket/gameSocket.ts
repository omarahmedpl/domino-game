import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  createInitialGameState,
  applyMove,
  applyDraw,
  applyPass,
  getPlayableOptions,
  PlaceSide,
} from '../utils/gameLogic';
import Match from '../models/Match';
import User from '../models/User';

interface Room {
  code: string;
  hostId: string;
  players: Array<{ id: string; username: string; socketId: string }>;
  gameState: GameState | null;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  startTime: number;
}

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; username: string }>();

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function sanitizeGameState(state: GameState, forPlayerId: string): GameState {
  // Hide other players' hands
  return {
    ...state,
    boneyard: state.boneyard.map(() => ({ left: -1, right: -1, id: 'hidden' })),
    players: state.players.map((p) => ({
      ...p,
      hand: p.id === forPlayerId ? p.hand : p.hand.map(() => ({ left: -1, right: -1, id: 'hidden' })),
    })),
  };
}

async function saveMatchResult(room: Room): Promise<void> {
  try {
    if (!room.gameState) return;
    const players = room.gameState.players.map((p) => ({
      userId: p.id,
      username: p.username,
      score: p.hand.reduce((sum, t) => sum + t.left + t.right, 0),
      isWinner: p.id === room.gameState!.winner,
    }));
    await Match.create({
      roomCode: room.code,
      players,
      duration: Math.floor((Date.now() - room.startTime) / 1000),
      completedAt: new Date(),
      totalMoves: room.gameState.totalMoves,
    });
    // Update user stats
    for (const p of room.gameState.players) {
      await User.findByIdAndUpdate(p.id, {
        $inc: {
          gamesPlayed: 1,
          gamesWon: p.id === room.gameState!.winner ? 1 : 0,
        },
      });
    }
  } catch (err) {
    console.error('Error saving match:', err);
  }
}

export function setupSocketHandlers(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      // Allow guest connections with username
      const username = socket.handshake.auth.username;
      if (username) {
        socketToUser.set(socket.id, { userId: socket.id, username });
        return next();
      }
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        username: string;
      };
      socketToUser.set(socket.id, decoded);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socketToUser.get(socket.id);
    console.log(`Socket connected: ${socket.id} (${user?.username})`);

    // Always tell the client what userId the server assigned them
    socket.emit('identity', { userId: user?.userId, username: user?.username });

    // Create room
    socket.on('create_room', (data: { maxPlayers?: number }) => {
      const code = generateRoomCode();
      const userInfo = socketToUser.get(socket.id)!;
      const room: Room = {
        code,
        hostId: socket.id,
        players: [{ id: userInfo.userId, username: userInfo.username, socketId: socket.id }],
        gameState: null,
        maxPlayers: data.maxPlayers || 2,
        status: 'waiting',
        startTime: 0,
      };
      rooms.set(code, room);
      socketToRoom.set(socket.id, code);
      socket.join(code);
      socket.emit('room_created', { code, room: serializeRoom(room) });
    });

    // Join room
    socket.on('join_room', (data: { code: string }) => {
      const room = rooms.get(data.code.toUpperCase());
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }
      if (room.players.length >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }
      const userInfo = socketToUser.get(socket.id)!;
      // Prevent duplicate join
      if (room.players.find((p) => p.id === userInfo.userId)) {
        socket.emit('error', { message: 'Already in room' });
        return;
      }
      room.players.push({ id: userInfo.userId, username: userInfo.username, socketId: socket.id });
      socketToRoom.set(socket.id, room.code);
      socket.join(room.code);
      io.to(room.code).emit('player_joined', { room: serializeRoom(room) });

      if (room.players.length === room.maxPlayers) {
        io.to(room.code).emit('room_ready', { room: serializeRoom(room) });
      }
    });

    // Start game
    socket.on('start_game', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || room.hostId !== socket.id) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }
      if (room.players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players' });
        return;
      }
      room.gameState = createInitialGameState(
        room.players.map((p) => ({ id: p.id, username: p.username }))
      );
      room.status = 'playing';
      room.startTime = Date.now();

      // Send personalized state to each player
      room.players.forEach((p) => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket && room.gameState) {
          playerSocket.emit('game_started', {
            gameState: sanitizeGameState(room.gameState, p.id),
          });
        }
      });
    });

    // Play tile
    socket.on('play_tile', (data: { tileId: string; side: PlaceSide }) => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || !room.gameState) return;

      const userInfo = socketToUser.get(socket.id)!;
      const result = applyMove(room.gameState, userInfo.userId, data.tileId, data.side);

      if (!result.valid) {
        socket.emit('error', { message: result.message });
        return;
      }

      room.gameState = result.newState!;

      // Broadcast updated state (personalized)
      room.players.forEach((p) => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket && room.gameState) {
          playerSocket.emit('game_updated', {
            gameState: sanitizeGameState(room.gameState, p.id),
            lastAction: { type: 'play', playerId: userInfo.userId, username: userInfo.username, tileId: data.tileId, side: data.side },
          });
        }
      });

      if (room.gameState.status === 'finished') {
        io.to(code).emit('game_over', {
          winner: room.gameState.winner,
          winnerUsername: room.players.find((p) => p.id === room.gameState!.winner)?.username,
          gameState: room.gameState,
        });
        room.status = 'finished';
        saveMatchResult(room);
      }
    });

    // Draw tile
    socket.on('draw_tile', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || !room.gameState) return;

      const userInfo = socketToUser.get(socket.id)!;
      const result = applyDraw(room.gameState, userInfo.userId);

      if (!result.valid) {
        socket.emit('error', { message: result.message });
        return;
      }

      room.gameState = result.newState!;
      room.players.forEach((p) => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket && room.gameState) {
          playerSocket.emit('game_updated', {
            gameState: sanitizeGameState(room.gameState, p.id),
            lastAction: { type: 'draw', playerId: userInfo.userId, username: userInfo.username },
          });
        }
      });
    });

    // Pass turn
    socket.on('pass_turn', () => {
      const code = socketToRoom.get(socket.id);
      if (!code) return;
      const room = rooms.get(code);
      if (!room || !room.gameState) return;

      const userInfo = socketToUser.get(socket.id)!;
      const { canPlay, canDraw } = getPlayableOptions(room.gameState, userInfo.userId);

      if (canPlay || canDraw) {
        socket.emit('error', { message: 'You can still play or draw' });
        return;
      }

      const result = applyPass(room.gameState, userInfo.userId);
      if (!result.valid) {
        socket.emit('error', { message: result.message });
        return;
      }

      room.gameState = result.newState!;
      room.players.forEach((p) => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket && room.gameState) {
          playerSocket.emit('game_updated', {
            gameState: sanitizeGameState(room.gameState, p.id),
            lastAction: { type: 'pass', playerId: userInfo.userId, username: userInfo.username },
          });
        }
      });

      if (room.gameState.status === 'finished') {
        io.to(code).emit('game_over', {
          winner: room.gameState.winner,
          winnerUsername: room.players.find((p) => p.id === room.gameState!.winner)?.username,
          gameState: room.gameState,
        });
        room.status = 'finished';
        saveMatchResult(room);
      }
    });

    // Leave room
    socket.on('leave_room', () => {
      handleLeave(socket, io);
    });

    // Disconnect
    socket.on('disconnect', () => {
      handleLeave(socket, io);
      socketToUser.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function handleLeave(socket: Socket, io: Server): void {
  const code = socketToRoom.get(socket.id);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;

  const userInfo = socketToUser.get(socket.id);
  socketToRoom.delete(socket.id);
  room.players = room.players.filter((p) => p.socketId !== socket.id);

  if (room.players.length === 0) {
    rooms.delete(code);
    return;
  }

  // Transfer host if needed
  if (room.hostId === socket.id && room.players.length > 0) {
    room.hostId = room.players[0].socketId;
  }

  if (room.status === 'playing' && room.gameState) {
    // Mark as disconnected
    const playerInGame = room.gameState.players.find((p) => p.id === userInfo?.userId);
    if (playerInGame) playerInGame.isConnected = false;
    io.to(code).emit('player_disconnected', {
      playerId: userInfo?.userId,
      username: userInfo?.username,
      room: serializeRoom(room),
    });
  } else {
    io.to(code).emit('player_left', {
      playerId: userInfo?.userId,
      username: userInfo?.username,
      room: serializeRoom(room),
    });
  }

  socket.leave(code);
}

function serializeRoom(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map((p) => ({ id: p.id, username: p.username })),
    maxPlayers: room.maxPlayers,
    status: room.status,
  };
}
