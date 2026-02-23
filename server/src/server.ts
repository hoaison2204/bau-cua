import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getOrCreateRoom } from './gameEngine';
import {
  DEFAULT_ROOM,
  ROLL_DURATION_MS,
} from './types';
import type {
  JoinGamePayload,
  PlaceBetPayload,
  RemoveBetPayload,
  GameSymbol,
} from './types';

// ─── Express + HTTP + Socket.IO setup ────────────────────────────────────────

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Socket.IO connection handler ─────────────────────────────────────────────

// Track socket → { playerId, roomId }
const socketMeta = new Map<string, { playerId: string; roomId: string }>();

io.on('connection', (socket: Socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── join_game ──────────────────────────────────────────────────────────────
  socket.on('join_game', (payload: JoinGamePayload) => {
    try {
      const roomId = DEFAULT_ROOM;
      const playerId = payload.playerId ?? uuidv4();
      const playerName = (payload.playerName ?? 'Ẩn Danh').trim().slice(0, 24) || 'Ẩn Danh';

      const room = getOrCreateRoom(roomId);
      const player = room.addPlayer(playerId, playerName);

      socket.join(roomId);
      socketMeta.set(socket.id, { playerId, roomId });

      console.log(`[join] ${playerName} (${playerId}) joined room ${roomId}`);

      // Send current state to joining player
      socket.emit('game_state', {
        roomState: room.getState(),
        yourPlayerId: playerId,
      });

      // Notify others
      socket.to(roomId).emit('player_joined', { player });
    } catch (err) {
      console.error('[join_game] error:', err);
      socket.emit('error_event', { message: 'Failed to join game' });
    }
  });

  // ── place_bet ──────────────────────────────────────────────────────────────
  socket.on('place_bet', (payload: PlaceBetPayload) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;

      const { playerId, roomId } = meta;
      const room = getOrCreateRoom(roomId);
      const result = room.placeBet(playerId, payload.symbol as GameSymbol);

      if (!result.ok) {
        socket.emit('error_event', { message: result.error ?? 'Cannot place bet' });
        return;
      }

      const bets = room.getBetsForPlayer(playerId);
      io.to(roomId).emit('bets_updated', { playerId, bets });
    } catch (err) {
      console.error('[place_bet] error:', err);
    }
  });

  // ── remove_bet ────────────────────────────────────────────────────────────
  socket.on('remove_bet', (payload: RemoveBetPayload) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;

      const { playerId, roomId } = meta;
      const room = getOrCreateRoom(roomId);
      room.removeBet(playerId, payload.symbol as GameSymbol);

      const bets = room.getBetsForPlayer(playerId);
      io.to(roomId).emit('bets_updated', { playerId, bets });
    } catch (err) {
      console.error('[remove_bet] error:', err);
    }
  });

  // ── reset_bet ─────────────────────────────────────────────────────────────
  socket.on('reset_bet', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;

      const { playerId, roomId } = meta;
      const room = getOrCreateRoom(roomId);
      room.resetBets(playerId);

      const bets = room.getBetsForPlayer(playerId);
      io.to(roomId).emit('bets_updated', { playerId, bets });
    } catch (err) {
      console.error('[reset_bet] error:', err);
    }
  });

  // ── roll_dice ─────────────────────────────────────────────────────────────
  socket.on('roll_dice', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta) return;

      const { roomId } = meta;
      const room = getOrCreateRoom(roomId);

      const startResult = room.startRoll();
      if (!startResult.ok) {
        socket.emit('error_event', { message: startResult.error ?? 'Cannot roll now' });
        return;
      }

      // Tell all clients animation is starting
      io.to(roomId).emit('dice_rolling', {});

      // Wait for animation duration then broadcast result
      setTimeout(() => {
        const result = room.finishRoll();
        io.to(roomId).emit('dice_result', {
          dice: result.dice,
          results: result.results,
          history: result.history,
          bankerBalance: result.bankerBalance,
          updatedPlayers: result.updatedPlayers,
        });
      }, ROLL_DURATION_MS);
    } catch (err) {
      console.error('[roll_dice] error:', err);
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (meta) {
        const { playerId, roomId } = meta;
        const room = getOrCreateRoom(roomId);
        room.disconnectPlayer(playerId);
        socket.to(roomId).emit('player_left', { playerId });
        socketMeta.delete(socket.id);
        console.log(`[socket] disconnected: ${socket.id} (player ${playerId})`);
      }
    } catch (err) {
      console.error('[disconnect] error:', err);
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎲 Bầu Cua server running on http://localhost:${PORT}\n`);
});
