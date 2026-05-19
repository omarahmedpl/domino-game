import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { useSounds } from '../hooks/useSounds';
import { RoomInfo } from '../types';

export default function LobbyPage() {
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [error, setError] = useState('');
  const [isHost, setIsHost] = useState(false);
  const { emit, on, off } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { play } = useSounds();

  useEffect(() => {
    const handleRoomCreated = (data: { code: string; room: RoomInfo }) => {
      setRoomCode(data.code);
      setRoom(data.room);
      setIsHost(true);
      play('join');
    };

    const handlePlayerJoined = (data: { room: RoomInfo }) => {
      setRoom(data.room);
      play('join');
    };

    const handleRoomReady = (data: { room: RoomInfo }) => {
      setRoom(data.room);
    };

    const handleGameStarted = (data: { gameState: unknown }) => {
      navigate('/game', { state: { gameState: data.gameState, room } });
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      play('error');
      setTimeout(() => setError(''), 4000);
    };

    const handlePlayerLeft = (data: { room: RoomInfo }) => {
      setRoom(data.room);
    };

    const cleanupFns = [
      on('room_created', handleRoomCreated as (...args: unknown[]) => void),
      on('player_joined', handlePlayerJoined as (...args: unknown[]) => void),
      on('room_ready', handleRoomReady as (...args: unknown[]) => void),
      on('game_started', handleGameStarted as (...args: unknown[]) => void),
      on('error', handleError as (...args: unknown[]) => void),
      on('player_left', handlePlayerLeft as (...args: unknown[]) => void),
    ];

    return () => {
      cleanupFns.forEach((fn) => fn && fn());
    };
  }, [on, off, navigate, play, room]);

  const handleCreate = () => {
    setError('');
    emit('create_room', { maxPlayers: playerCount });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    setError('');
    emit('join_room', { code: joinCode.trim().toUpperCase() });
  };

  const handleStart = () => {
    emit('start_game');
    play('click');
  };

  const handleLeave = () => {
    emit('leave_room');
    setRoom(null);
    setRoomCode('');
    setIsHost(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen felt-table flex items-center justify-center">
        <div className="card p-8 text-center text-white">
          <p className="mb-4">Please sign in to play</p>
          <a href="/login" className="btn-gold">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-table flex items-center justify-center p-4 pt-20">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-4xl font-bold text-white mb-2">Game Lobby</h1>
          <p className="text-white/60 font-body">Create a room or join with a code</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm font-body mb-4 text-center"
          >
            {error}
          </motion.div>
        )}

        {!room ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h2 className="font-display text-xl font-semibold text-white mb-4">Create Room</h2>
              <div className="mb-4">
                <label className="text-white/60 text-sm font-body block mb-2">Players</label>
                <div className="flex gap-2">
                  {([2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPlayerCount(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                        playerCount === n
                          ? 'bg-felt-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {n}P
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreate} className="btn-gold w-full">
                Create Room
              </button>
            </motion.div>

            {/* Join Room */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="card p-6"
            >
              <h2 className="font-display text-xl font-semibold text-white mb-4">Join Room</h2>
              <div className="mb-4">
                <label className="text-white/60 text-sm font-body block mb-2">Room Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="input-field text-center text-xl font-mono tracking-widest uppercase"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button onClick={handleJoin} className="btn-primary w-full">
                Join Room
              </button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8"
          >
            <div className="text-center mb-6">
              <p className="text-white/60 text-sm font-body mb-2">Room Code</p>
              <div className="font-mono text-5xl font-bold text-yellow-400 tracking-widest glow-gold rounded-xl py-3 bg-black/20">
                {room.code}
              </div>
              <p className="text-white/40 text-xs font-body mt-2">Share this code with friends</p>
            </div>

            <div className="mb-6">
              <p className="text-white/60 text-sm font-body mb-3 text-center">
                Players ({room.players.length}/{room.maxPlayers})
              </p>
              <div className="space-y-2">
                {room.players.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-black/20 rounded-lg px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-felt-600 flex items-center justify-center text-white font-semibold text-sm">
                      {p.username[0].toUpperCase()}
                    </div>
                    <span className="text-white font-body">{p.username}</span>
                    {p.id === room.hostId && (
                      <span className="ml-auto text-xs text-yellow-400 font-body">Host 👑</span>
                    )}
                  </div>
                ))}
                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/10 rounded-lg px-4 py-3 border border-dashed border-white/20">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/30 text-sm">
                      ?
                    </div>
                    <span className="text-white/30 font-body italic text-sm">Waiting for player...</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              {isHost && (
                <button
                  onClick={handleStart}
                  disabled={room.players.length < 2}
                  className={`flex-1 btn-gold ${room.players.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {room.players.length < 2 ? 'Waiting for players...' : '▶ Start Game'}
                </button>
              )}
              {!isHost && (
                <div className="flex-1 text-center text-white/50 font-body py-3">
                  Waiting for host to start...
                </div>
              )}
              <button onClick={handleLeave} className="btn-secondary px-4">
                Leave
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
