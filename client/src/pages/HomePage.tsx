import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const features = [
  { icon: '⚡', title: 'Real-time Multiplayer', desc: 'Play live with friends using a room code' },
  { icon: '🎯', title: 'Classic Rules', desc: 'Authentic domino gameplay with full rule validation' },
  { icon: '🌙', title: 'Dark Mode', desc: 'Easy on your eyes, day or night' },
  { icon: '📱', title: 'Mobile Friendly', desc: 'Play on any device, any screen size' },
];

function DominoDecor({ values, delay }: { values: [number, number]; delay: number }) {
  const [l, r] = values;
  const dots = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} className="w-2 h-2 rounded-full bg-stone-700/60" />
    ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="w-20 h-10 bg-stone-100 rounded border-2 border-stone-300 flex items-center justify-center shadow-xl"
      style={{ boxShadow: '3px 3px 12px rgba(0,0,0,0.4)' }}
    >
      <div className="flex items-center gap-1 px-1">
        <div className="flex flex-wrap w-7 h-full items-center justify-center gap-0.5">
          {dots(l)}
        </div>
        <div className="w-px h-6 bg-stone-300" />
        <div className="flex flex-wrap w-7 h-full items-center justify-center gap-0.5">
          {dots(r)}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen felt-table flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-24 pb-16">
        {/* Decorative tiles */}
        <div className="flex gap-3 mb-10 flex-wrap justify-center">
          {([[6,6],[5,4],[3,2],[1,1]] as [number,number][]).map((v, i) => (
            <DominoDecor key={i} values={v} delay={i * 0.1} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-5xl sm:text-7xl font-black text-white text-shadow mb-4 leading-none">
            Domino<span className="text-yellow-400">King</span>
          </h1>
          <p className="font-body text-white/70 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            The classic tile game, reimagined for the modern web.
            Play with friends in real-time — no downloads required.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={user ? '/lobby' : '/login'} className="btn-gold text-lg px-8 py-4">
              {user ? '🎮 Play Now' : '🚀 Get Started'}
            </Link>
            {!user && (
              <Link to="/login?guest=1" className="btn-secondary text-lg px-8 py-4">
                Play as Guest
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto w-full px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="card p-6 text-center hover:bg-white/15 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-white/60 text-sm font-body">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-white/30 text-xs font-body">
        DominoKing · Built with React, Node.js &amp; Socket.IO
      </footer>
    </div>
  );
}
