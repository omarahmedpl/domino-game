import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Match from '../models/Match';

const router = Router();

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({
      'players.userId': req.userId,
    })
      .sort({ completedAt: -1 })
      .limit(10);
    res.json(matches);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matches = await Match.find({ 'players.userId': req.userId });
    const totalGames = matches.length;
    const wins = matches.filter((m) =>
      m.players.find((p) => p.userId === req.userId && p.isWinner)
    ).length;
    res.json({ totalGames, wins, losses: totalGames - wins });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
