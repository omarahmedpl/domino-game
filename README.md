# 🁣 DominoKing — Multiplayer Domino Game

A full-stack real-time multiplayer domino game built with **React**, **Node.js**, **Socket.IO**, **MongoDB**, and **TypeScript**.

---

## ✨ Features

- 🎮 **Real-time Multiplayer** — play with 2–4 players using Socket.IO
- 🔑 **Room Codes** — create or join rooms with a 6-character code
- 🧠 **Full Game Logic** — tile distribution, turn validation, draw/pass, win detection
- 🔐 **JWT Authentication** — or play as a guest instantly
- 🌙 **Dark Mode** — persisted preference
- 🎵 **Sound Effects** — synthesized Web Audio API sounds
- 📱 **Mobile Responsive** — works on any screen
- 🎨 **Modern UI** — green felt table, ivory domino tiles, smooth animations
- 🏆 **Match History** — stored in MongoDB for registered users

---

## 🗂️ Project Structure

```
domino-game/
├── client/                      # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── game/            # DominoPip, DominoTile, GameBoard, PlayerHand, etc.
│   │   │   └── ui/              # Navbar
│   │   ├── contexts/            # AuthContext, DarkModeContext
│   │   ├── hooks/               # useSocket, useSounds
│   │   ├── pages/               # HomePage, LoginPage, RegisterPage, LobbyPage, GamePage
│   │   └── types/               # Shared TypeScript interfaces
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── server/                      # Node.js + Express backend
    └── src/
        ├── controllers/         # authController
        ├── middleware/           # JWT auth middleware
        ├── models/              # User, Match (Mongoose schemas)
        ├── routes/              # /api/auth, /api/game
        ├── socket/              # Socket.IO game handler
        └── utils/               # gameLogic.ts (pure game functions)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo>
cd domino-game
npm run install:all
```

### 2. Configure Server Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/domino-game
JWT_SECRET=your-super-secret-key
CLIENT_URL=http://localhost:5173
```

### 3. Start Development

```bash
npm run dev
```

This runs both the server (port 3001) and client (port 5173) concurrently.

Open http://localhost:5173 in your browser.

---

## 🎮 How to Play

1. **Register** an account or play as a **Guest**
2. Go to **Lobby** → Create or join a room with a code
3. Host clicks **Start Game** when ready
4. On your turn:
   - Click a **highlighted tile** in your hand to select it
   - Click the **← →** arrows on the board to place it left or right
   - Or click **Draw Tile** to draw from the boneyard
   - Or click **Pass** if you have no valid moves
5. First player to empty their hand **wins**!

### Rules
- Standard double-six domino rules
- 7 tiles per player (2P), 5 tiles (3–4P)
- Player with highest double starts
- If blocked (no one can play), lowest pip count wins

---

## 🗄️ Database Schema

### User
```typescript
{
  username: string       // unique, 3–20 chars
  email: string          // unique
  password: string       // bcrypt hashed
  gamesPlayed: number
  gamesWon: number
  createdAt: Date
}
```

### Match
```typescript
{
  roomCode: string
  players: [{
    userId: string
    username: string
    score: number        // pip count remaining
    isWinner: boolean
  }]
  duration: number       // seconds
  totalMoves: number
  completedAt: Date
}
```

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ maxPlayers }` | Create a new room |
| `join_room` | `{ code }` | Join by room code |
| `start_game` | — | Host starts the game |
| `play_tile` | `{ tileId, side }` | Place a tile |
| `draw_tile` | — | Draw from boneyard |
| `pass_turn` | — | Pass when stuck |
| `leave_room` | — | Leave current room |

### Server → Client
| Event | Description |
|-------|-------------|
| `room_created` | Room created successfully |
| `player_joined` | Someone joined the room |
| `room_ready` | Room is full |
| `game_started` | Game begins (with personalized state) |
| `game_updated` | State after each move |
| `game_over` | Match ended with winner |
| `player_disconnected` | A player lost connection |
| `error` | Error message |

---

## 🔐 REST API

### Auth
- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/profile` — Bearer token required

### Game
- `GET /api/game/history` — Match history (auth required)
- `GET /api/game/stats` — Win/loss stats (auth required)

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Realtime | Socket.IO |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Sound | Web Audio API |

---

## 🚢 Deployment

1. Build both apps: `npm run build`
2. Serve `client/dist` from a static CDN or express static
3. Deploy `server/dist` to any Node.js host
4. Set production env vars (MongoDB Atlas URI, strong JWT secret)
5. Set `CLIENT_URL` to your frontend domain

---

## 📄 License

MIT
