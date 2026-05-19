import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import { setupSocketHandlers } from './socket/gameSocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const isProd = process.env.NODE_ENV === 'production';

const io = new Server(httpServer, {
  cors: {
    origin: isProd ? false : (process.env.CLIENT_URL || 'http://localhost:5173'),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: isProd ? false : (process.env.CLIENT_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built React app in production
if (isProd) {
  const possiblePaths = [
    path.join(__dirname, '../../client/dist'),
    path.join(__dirname, '../../../client/dist'),
    path.join(process.cwd(), 'client/dist'),
    '/app/client/dist',
  ];

  let clientDist = possiblePaths[0];
  for (const p of possiblePaths) {
    try {
      require('fs').accessSync(p);
      clientDist = p;
      console.log('✅ Found client dist at:', p);
      break;
    } catch {
      console.log('❌ Not found:', p);
    }
  }

  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Socket.IO setup
setupSocketHandlers(io);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/domino-game';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
