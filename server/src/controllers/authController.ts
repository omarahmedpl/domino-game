import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (userId: string, username: string): string => {
  return jwt.sign(
    { userId, username },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(409).json({ message: 'Username or email already exists' });
      return;
    }
    const user = new User({ username, email, password });
    await user.save();
    const token = generateToken(user._id.toString(), user.username);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = generateToken(user._id.toString(), user.username);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
      },
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
