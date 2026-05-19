import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isGuest = params.get('guest') === '1';
  const [mode, setMode] = useState<'login' | 'guest'>(isGuest ? 'guest' : 'login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/lobby');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    guestLogin(guestName.trim());
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen felt-table flex items-center justify-center p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8"
      >
        <div className="text-center mb-8">
          <span className="text-4xl">⬛</span>
          <h1 className="font-display text-3xl font-bold text-white mt-2">Welcome Back</h1>
          <p className="text-white/50 font-body mt-1">Sign in to continue playing</p>
        </div>

        <div className="flex bg-white/10 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              mode === 'login' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('guest')}
            className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              mode === 'guest' ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Play as Guest
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm font-body mb-4">
            {error}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-body block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-white/70 text-sm font-body block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGuest} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-body block mb-1">Your Nickname</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="CoolPlayer99"
                className="input-field"
                maxLength={20}
                required
              />
            </div>
            <button type="submit" className="btn-gold w-full mt-6">
              Play as Guest →
            </button>
          </form>
        )}

        <p className="text-center text-white/40 text-sm font-body mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-felt-400 hover:text-felt-300 transition-colors">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
