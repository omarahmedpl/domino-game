import React from 'react';
import { PlayerState, GameState } from '../../types';

interface OpponentBarProps {
  player: PlayerState;
  gameState: GameState;
  playerIndex: number;
}

export default function OpponentBar({ player, gameState, playerIndex }: OpponentBarProps) {
  const isCurrentTurn = gameState.currentPlayerIndex === playerIndex;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
      isCurrentTurn ? 'bg-yellow-400/20 ring-1 ring-yellow-400/50' : 'bg-black/20'
    }`}>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${player.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />

      <span className="text-white text-sm font-body font-medium truncate max-w-[100px]">
        {player.username}
      </span>

      {isCurrentTurn && (
        <span className="text-yellow-400 text-xs font-body">● thinking...</span>
      )}

      {/* Compact tile count visualization */}
      <div className="flex gap-0.5 ml-1">
        {Array.from({ length: Math.min(player.hand.length, 14) }).map((_, i) => (
          <div
            key={i}
            className="rounded-sm bg-domino-ivory border border-stone-300/60 flex-shrink-0"
            style={{ width: 10, height: 18, boxShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
          />
        ))}
        {player.hand.length > 14 && (
          <span className="text-white/40 text-xs ml-1 self-center">+{player.hand.length - 14}</span>
        )}
      </div>

      <div className="text-white/40 text-xs font-mono ml-auto flex-shrink-0">
        {player.hand.length} tiles
      </div>
    </div>
  );
}
