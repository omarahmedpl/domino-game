import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  roomCode: string;
  players: Array<{
    userId: string;
    username: string;
    score: number;
    isWinner: boolean;
  }>;
  duration: number; // seconds
  completedAt: Date;
  totalMoves: number;
}

const MatchSchema = new Schema<IMatch>({
  roomCode: { type: String, required: true },
  players: [
    {
      userId: String,
      username: String,
      score: { type: Number, default: 0 },
      isWinner: { type: Boolean, default: false },
    },
  ],
  duration: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
  totalMoves: { type: Number, default: 0 },
});

export default mongoose.model<IMatch>('Match', MatchSchema);
