import React from 'react';
import { motion } from 'framer-motion';

interface WinnerModalProps {
  isWinner: boolean;
  winnerUsername: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function WinnerModal({ isWinner, winnerUsername, onPlayAgain, onLeave }: WinnerModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`card max-w-sm w-full text-center p-8 ${
          isWinner
            ? 'ring-2 ring-yellow-400 animate-winner-glow'
            : 'ring-1 ring-white/20'
        }`}
      >
        {isWinner ? (
          <>
            <div className="text-6xl mb-4 animate-float">🏆</div>
            <h2 className="font-display text-3xl font-bold text-yellow-400 mb-2">Victory!</h2>
            <p className="text-white/70 font-body mb-6">You won the match!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">😔</div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">Defeat</h2>
            <p className="text-white/70 font-body mb-6">
              <span className="text-white font-semibold">{winnerUsername}</span> wins this round.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={onPlayAgain} className="btn-gold w-full">
            Play Again
          </button>
          <button onClick={onLeave} className="btn-secondary w-full">
            Leave Table
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
