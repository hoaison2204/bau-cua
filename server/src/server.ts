import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  createRoom,
  getRoom,
  deleteRoom,
  getAllRooms,
} from './gameEngine';
import { ROLL_DURATION_MS } from './types';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  PlaceBetPayload,
  RemoveBetPayload,
  GameSymbol,
} from './types';

//  Express + HTTP + Socket.IO

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

//  Socket metadata

interface SocketMeta {
  playerId: string;
  roomId: string;
  isHost: boolean;
}

const socketMeta = new Map<string, SocketMeta>();

//  Helpers

const broadcastRoomList = () => {
  const list = getAllRooms().map((r) => r.getSummary());
  io.emit('room_list', { rooms: list });
};

//  Health check

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

//  Socket events

io.on('connection', (socket: Socket) => {
  console.log('[connect]', socket.id);

  // Send room list immediately on connect
  socket.emit('room_list', { rooms: getAllRooms().map((r) => r.getSummary()) });

  //  create_room
  socket.on('create_room', (payload: CreateRoomPayload) => {
    try {
      const hostName = (payload.hostName ?? 'Host').trim().slice(0, 24) || 'Host';
      const hostId = uuidv4();
      const room = createRoom(hostId, hostName);

      socket.join(room.id);
      socketMeta.set(socket.id, { playerId: hostId, roomId: room.id, isHost: true });

      console.log(`[create_room] ${hostName} created room ${room.id}`);

      socket.emit('room_joined', {
        roomState: room.getState(),
        yourPlayerId: hostId,
        isHost: true,
      });

      broadcastRoomList();
    } catch (err) {
      console.error('[create_room]', err);
      socket.emit('error', { code: 'create_failed', message: 'Failed to create room' });
    }
  });

  //  get_rooms
  socket.on('get_rooms', () => {
    socket.emit('room_list', { rooms: getAllRooms().map((r) => r.getSummary()) });
  });

  //  join_room
  socket.on('join_room', (payload: JoinRoomPayload) => {
    try {
      const roomId = (payload.roomId ?? '').trim().toUpperCase();
      const playerName = (payload.playerName ?? 'Ẩn Danh').trim().slice(0, 24) || 'Ẩn Danh';
      const playerId = payload.playerId ?? uuidv4();

      const room = getRoom(roomId);
      if (!room) {
        socket.emit('error', { code: 'room_not_found', message: 'Room not found' });
        return;
      }

      const result = room.addPlayer(playerId, playerName);
      if (!result.ok) {
        socket.emit('error', { code: result.error ?? 'join_failed', message: result.error ?? 'Cannot join' });
        return;
      }

      socket.join(roomId);
      socketMeta.set(socket.id, { playerId, roomId, isHost: false });

      console.log(`[join_room] ${playerName} joined room ${roomId}`);

      // Send full state to new player
      socket.emit('room_joined', {
        roomState: room.getState(),
        yourPlayerId: playerId,
        isHost: false,
      });

      // Notify others
      if (result.player) {
        socket.to(roomId).emit('player_joined', { player: result.player });
      }

      broadcastRoomList();
    } catch (err) {
      console.error('[join_room]', err);
      socket.emit('error', { code: 'join_failed', message: 'Failed to join room' });
    }
  });

  //  place_bet
  socket.on('place_bet', (payload: PlaceBetPayload) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;

      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.placeBet(meta.playerId, payload.symbol as GameSymbol);
      if (!result.ok) {
        socket.emit('error', { code: 'bet_failed', message: result.error ?? 'Cannot bet' });
        return;
      }

      const bets = room.getBetsForPlayer(meta.playerId);
      io.to(meta.roomId).emit('bets_updated', { playerId: meta.playerId, bets });
    } catch (err) {
      console.error('[place_bet]', err);
    }
  });

  //  remove_bet
  socket.on('remove_bet', (payload: RemoveBetPayload) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;

      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.removeBet(meta.playerId, payload.symbol as GameSymbol);
      if (!result.ok) {
        socket.emit('error', { code: 'bet_failed', message: result.error ?? 'Cannot remove bet' });
        return;
      }

      const bets = room.getBetsForPlayer(meta.playerId);
      io.to(meta.roomId).emit('bets_updated', { playerId: meta.playerId, bets });
    } catch (err) {
      console.error('[remove_bet]', err);
    }
  });

  //  reset_bet
  socket.on('reset_bet', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;

      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.resetBets(meta.playerId);
      if (!result.ok) {
        socket.emit('error', { code: 'bet_failed', message: result.error ?? 'Cannot reset bets' });
        return;
      }

      const bets = room.getBetsForPlayer(meta.playerId);
      io.to(meta.roomId).emit('bets_updated', { playerId: meta.playerId, bets });
    } catch (err) {
      console.error('[reset_bet]', err);
    }
  });

  //  player_ready
  socket.on('player_ready', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;

      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.setReady(meta.playerId);
      if (!result.ok) {
        socket.emit('error', { code: 'ready_failed', message: result.error ?? 'Cannot ready' });
        return;
      }

      console.log(`[ready] ${meta.playerId} is ready in room ${meta.roomId}`);

      io.to(meta.roomId).emit('player_ready_update', {
        playerId: meta.playerId,
        readyPlayers: room.getReadyPlayers(),
      });
    } catch (err) {
      console.error('[player_ready]', err);
    }
  });

  //  roll_dice
  socket.on('roll_dice', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || !meta.isHost) {
        socket.emit('error', { code: 'not_host', message: 'Only host can roll' });
        return;
      }

      const room = getRoom(meta.roomId);
      if (!room) return;

      const startResult = room.startRoll(meta.playerId);
      if (!startResult.ok) {
        socket.emit('error', { code: 'roll_failed', message: startResult.error ?? 'Cannot roll' });
        return;
      }

      console.log(`[roll] Host rolling in room ${meta.roomId}`);
      io.to(meta.roomId).emit('dice_rolling', { roomState: room.getState() });

      setTimeout(() => {
        const result = room.finishRoll();
        console.log(`[result] Room ${meta.roomId} dice: ${result.dice.join(', ')}`);
        io.to(meta.roomId).emit('dice_result', {
          dice: result.dice,
          results: result.results,
          history: result.history,
          bankerBalance: result.bankerBalance,
          updatedPlayers: result.updatedPlayers,
        });
        broadcastRoomList();
      }, ROLL_DURATION_MS);
    } catch (err) {
      console.error('[roll_dice]', err);
    }
  });

  // ── leave_room ───────────────────────────────────────────────────────────────
  socket.on('leave_room', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    socketMeta.delete(socket.id);
    socket.leave(meta.roomId);

    const room = getRoom(meta.roomId);
    if (!room) return;

    if (meta.isHost) {
      // Host voluntarily left — close room
      io.to(meta.roomId).emit('error', {
        code: 'host_left',
        message: 'Host đã rời phòng. Phòng đã đóng.',
      });
      io.in(meta.roomId).socketsLeave(meta.roomId);
      deleteRoom(meta.roomId);
    } else {
      room.disconnectPlayer(meta.playerId);
      io.to(meta.roomId).emit('player_left', { playerId: meta.playerId });
      console.log(`[leave_room] Player ${meta.playerId} left room ${meta.roomId}`);
    }

    broadcastRoomList();
  });

  // ── disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    socketMeta.delete(socket.id);

    const room = getRoom(meta.roomId);
    if (!room) return;

    if (meta.isHost) {
      console.log(`[disconnect] Host left room ${meta.roomId}  closing room`);
      io.to(meta.roomId).emit('error', {
        code: 'host_left',
        message: 'Host đã rời phòng. Phòng đã đóng.',
      });
      io.in(meta.roomId).socketsLeave(meta.roomId);
      deleteRoom(meta.roomId);
    } else {
      room.disconnectPlayer(meta.playerId);
      io.to(meta.roomId).emit('player_left', { playerId: meta.playerId });
      console.log(`[disconnect] Player ${meta.playerId} left room ${meta.roomId}`);
    }

    broadcastRoomList();
  });
});

//  Start server

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`\n Bầu Cua server running on port ${PORT}\n`);
});
