import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { useSounds } from '../hooks/useSounds';
import { GameState, DominoTile, RoomInfo, LastAction } from '../types';
import GameBoard from '../components/game/GameBoard';
import PlayerHand from '../components/game/PlayerHand';
import OpponentBar from '../components/game/OpponentBar';
import ActionLog from '../components/game/ActionLog';
import WinnerModal from '../components/game/WinnerModal';

interface LocationState {
  gameState: GameState;
  room: RoomInfo;
}

function canTileFit(tile: DominoTile, state: GameState): boolean {
  if (state.board.length === 0) return true;
  return (
    tile.left === state.boardLeftEnd ||
    tile.right === state.boardLeftEnd ||
    tile.left === state.boardRightEnd ||
    tile.right === state.boardRightEnd
  );
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { emit, on } = useSocket();
  const { play } = useSounds();

  const locationState = location.state as LocationState | null;
  const [gameState, setGameState] = useState<GameState | null>(locationState?.gameState || null);
  const [selectedTile, setSelectedTile] = useState<DominoTile | null>(null);
  const [actionLog, setActionLog] = useState<(LastAction & { timestamp: number })[]>([]);
  const [winner, setWinner] = useState<{ id: string; username: string } | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [notification, setNotification] = useState('');

  const myId = user?.id || '';

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  useEffect(() => {
    if (!locationState?.gameState) {
      navigate('/lobby');
    }
  }, []);

  useEffect(() => {
    const handleGameUpdated = (data: { gameState: GameState; lastAction: LastAction }) => {
      setGameState(data.gameState);
      setSelectedTile(null);
      if (data.lastAction) {
        setActionLog((prev) => [...prev.slice(-49), { ...data.lastAction, timestamp: Date.now() }]);
        if (data.lastAction.type === 'play') play('place');
        else if (data.lastAction.type === 'draw') play('draw');
        else play('pass');
      }
    };

    const handleGameOver = (data: { winner: string; winnerUsername: string; gameState: GameState }) => {
      setGameState(data.gameState);
      setWinner({ id: data.winner, username: data.winnerUsername });
      if (data.winner === myId) play('win');
      else play('lose');
    };

    const handleError = (data: { message: string }) => {
      showNotif(data.message);
      play('error');
    };

    const handlePlayerDisconnected = (data: { username: string }) => {
      showNotif(`${data.username} disconnected`);
    };

    const c1 = on('game_updated', handleGameUpdated as (...args: unknown[]) => void);
    const c2 = on('game_over', handleGameOver as (...args: unknown[]) => void);
    const c3 = on('error', handleError as (...args: unknown[]) => void);
    const c4 = on('player_disconnected', handlePlayerDisconnected as (...args: unknown[]) => void);

    return () => { c1?.(); c2?.(); c3?.(); c4?.(); };
  }, [on, play, myId]);

  const handleTileSelect = useCallback((tile: DominoTile) => {
    if (selectedTile?.id === tile.id) {
      setSelectedTile(null);
      return;
    }
    setSelectedTile(tile);
    play('click');

    // If board is empty, just play it
    if (!gameState || gameState.board.length === 0) {
      emit('play_tile', { tileId: tile.id, side: 'right' });
      setSelectedTile(null);
    }
  }, [selectedTile, gameState, emit, play]);

  const handleSideSelect = useCallback((side: 'left' | 'right') => {
    if (!selectedTile) return;
    emit('play_tile', { tileId: selectedTile.id, side });
    setSelectedTile(null);
  }, [selectedTile, emit]);

  const handleDraw = () => {
    emit('draw_tile');
    play('draw');
  };

  const handlePass = () => {
    emit('pass_turn');
  };

  const handlePlayAgain = () => {
    setWinner(null);
    navigate('/lobby');
  };

  const handleLeave = () => {
    emit('leave_room');
    navigate('/lobby');
  };

  if (!gameState) return null;

  const myIndex = gameState.players.findIndex((p) => p.id === myId);
  const myPlayer = gameState.players[myIndex];
  const opponents = gameState.players.filter((p) => p.id !== myId);
  const isMyTurn = gameState.currentPlayerIndex === myIndex;
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  const myHand = myPlayer?.hand || [];
  const canPlay = isMyTurn && myHand.some((t) => canTileFit(t, gameState));
  const canDraw = isMyTurn && gameState.boneyard.length > 0;
  const canPass = isMyTurn && !canPlay && !canDraw;

  return (
    <div className="h-screen felt-table flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleLeave} className="text-white/50 hover:text-white text-sm transition-colors font-body">
            ← Leave
          </button>
          <div className="text-white/40 text-xs font-mono">
            Move #{gameState.totalMoves}
          </div>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/80 text-white text-sm font-body px-3 py-1.5 rounded-lg"
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className={`text-sm font-body font-medium px-3 py-1 rounded-lg ${
            isMyTurn ? 'bg-yellow-400/20 text-yellow-400' : 'bg-black/20 text-white/50'
          }`}>
            {isMyTurn ? '✦ Your Turn' : `${currentPlayer?.username}'s turn`}
          </div>
          <button
            onClick={() => setShowLog(!showLog)}
            className="text-white/50 hover:text-white text-xs transition-colors font-mono"
          >
            LOG
          </button>
        </div>
      </div>

      {/* Main game area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Game content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Opponents */}
          <div className="px-4 py-2 space-y-1.5 flex-shrink-0">
            {opponents.map((opp) => {
              const oppIndex = gameState.players.findIndex((p) => p.id === opp.id);
              return (
                <OpponentBar key={opp.id} player={opp} gameState={gameState} playerIndex={oppIndex} />
              );
            })}
          </div>

          {/* Board */}
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-2 rounded-2xl bg-black/20 border border-white/10 shadow-inner overflow-hidden">
              <GameBoard
                board={gameState.board}
                boardLeftEnd={gameState.boardLeftEnd}
                boardRightEnd={gameState.boardRightEnd}
                onSelectSide={handleSideSelect}
                selectedTile={selectedTile}
              />
            </div>

            {/* Boneyard info */}
            <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white/60 text-xs font-mono">
              🃏 {gameState.boneyard.length} left
            </div>
          </div>

          {/* Action buttons */}
          {isMyTurn && (
            <div className="flex justify-center gap-3 px-4 py-2 flex-shrink-0">
              {canDraw && !canPlay && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleDraw}
                  className="btn-secondary text-sm py-2 px-5"
                >
                  🎴 Draw Tile
                </motion.button>
              )}
              {canPass && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handlePass}
                  className="btn-secondary text-sm py-2 px-5"
                >
                  ⏭ Pass Turn
                </motion.button>
              )}
              {selectedTile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/50 text-xs font-body flex items-center"
                >
                  Click ← → arrows on the board to place
                </motion.div>
              )}
            </div>
          )}

          {/* Player hand */}
          <div className="border-t border-white/10 bg-black/20 flex-shrink-0 py-2">
            {myPlayer && (
              <PlayerHand
                tiles={myHand}
                gameState={gameState}
                playerId={myId}
                selectedTile={selectedTile}
                onTileSelect={handleTileSelect}
              />
            )}
          </div>
        </div>

        {/* Side log */}
        <AnimatePresence>
          {showLog && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-black/40 border-l border-white/10 overflow-hidden flex-shrink-0"
            >
              <ActionLog actions={actionLog} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Winner modal */}
      <AnimatePresence>
        {winner && (
          <WinnerModal
            isWinner={winner.id === myId}
            winnerUsername={winner.username}
            onPlayAgain={handlePlayAgain}
            onLeave={handleLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
