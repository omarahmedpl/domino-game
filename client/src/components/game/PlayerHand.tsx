import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DominoTile as DominoTileType, GameState } from '../../types';
import DominoTile from './DominoTile';

interface PlayerHandProps {
  tiles: DominoTileType[];
  gameState: GameState;
  playerId: string;
  selectedTile: DominoTileType | null;
  onTileSelect: (tile: DominoTileType) => void;
}

function canTileFit(tile: DominoTileType, state: GameState): boolean {
  if (state.board.length === 0) return true;
  return (
    tile.left === state.boardLeftEnd ||
    tile.right === state.boardLeftEnd ||
    tile.left === state.boardRightEnd ||
    tile.right === state.boardRightEnd
  );
}

export default function PlayerHand({ tiles, gameState, playerId, selectedTile, onTileSelect }: PlayerHandProps) {
  const myIndex = gameState.players.findIndex((p) => p.id === playerId);
  const isMyTurn = gameState.currentPlayerIndex === myIndex;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-white/50 font-body uppercase tracking-widest">
        {isMyTurn ? (
          <span className="text-yellow-400 animate-pulse">✦ Your Turn</span>
        ) : (
          <span>Your Hand ({tiles.length})</span>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 px-4 pb-2">
        <AnimatePresence>
          {tiles.map((tile) => {
            const playable = isMyTurn && canTileFit(tile, gameState);
            const isSelected = selectedTile?.id === tile.id;
            return (
              <motion.div
                key={tile.id}
                layout
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <DominoTile
                  tile={tile}
                  isPlayable={playable}
                  isSelected={isSelected}
                  onClick={() => playable && onTileSelect(tile)}
                  size="md"
                  orientation="horizontal"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {tiles.length === 0 && (
          <div className="text-white/30 text-sm font-body italic">No tiles remaining</div>
        )}
      </div>
    </div>
  );
}
