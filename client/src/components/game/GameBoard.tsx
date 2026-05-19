import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DominoTile as DominoTileType } from '../../types';
import DominoTileComponent from './DominoTile';

interface GameBoardProps {
  board: DominoTileType[];
  boardLeftEnd: number;
  boardRightEnd: number;
  onSelectSide?: (side: 'left' | 'right') => void;
  selectedTile: DominoTileType | null;
}

export default function GameBoard({ board, boardLeftEnd, boardRightEnd, onSelectSide, selectedTile }: GameBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, [board.length]);

  const canPlayLeft = selectedTile
    ? selectedTile.left === boardLeftEnd || selectedTile.right === boardLeftEnd
    : false;
  const canPlayRight = selectedTile
    ? selectedTile.left === boardRightEnd || selectedTile.right === boardRightEnd
    : false;

  if (board.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white/40">
          <div className="text-4xl mb-2">🁣</div>
          <p className="text-sm font-body">Play the first tile to start</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="board-scroll flex items-center justify-start gap-0.5 h-full px-8 py-2"
      style={{ minHeight: 80 }}
    >
      {selectedTile && canPlayLeft && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectSide?.('left')}
          className="flex-shrink-0 w-10 h-10 rounded-lg border-2 border-dashed border-yellow-400 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-colors mr-1"
          title="Play to the left"
        >
          ←
        </motion.button>
      )}

      <AnimatePresence>
        {board.map((tile, idx) => (
          <motion.div
            key={tile.id + idx}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex-shrink-0"
          >
            <DominoTileComponent
              tile={tile}
              orientation="horizontal"
              size="md"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {selectedTile && canPlayRight && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onSelectSide?.('right')}
          className="flex-shrink-0 w-10 h-10 rounded-lg border-2 border-dashed border-yellow-400 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-colors ml-1"
          title="Play to the right"
        >
          →
        </motion.button>
      )}

      {board.length > 0 && !selectedTile && (
        <div className="flex-shrink-0 ml-2 flex items-center gap-2 text-white/30 text-xs font-body">
          <span className="bg-black/20 rounded px-2 py-1">L: {boardLeftEnd}</span>
          <span className="bg-black/20 rounded px-2 py-1">R: {boardRightEnd}</span>
        </div>
      )}
    </div>
  );
}