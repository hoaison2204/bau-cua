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
  getRoomByPlayerId,
} from './gameEngine';
import { ROLL_DURATION_MS, DISCONNECT_TIMEOUT_MS } from './types';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  ReconnectPlayerPayload,
  SetBetPayload,
  GameSymbol,
} from './types';

// \u2500\u2500 Express + HTTP + Socket.IO

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// \u2500\u2500 Socket metadata \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface SocketMeta {
  playerId: string;
  roomId: string;
  isHost: boolean;
}

const socketMeta = new Map<string, SocketMeta>();          // socketId \u2192 meta
const playerSocketMap = new Map<string, string>();         // playerId \u2192 socketId
const disconnectTimers = new Map<string, NodeJS.Timeout>(); // playerId \u2192 timer

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const broadcastRoomList = () => {
  const list = getAllRooms().map((r) => r.getSummary());
  io.emit('room_list', { rooms: list });
};

const clearTimer = (playerId: string) => {
  const t = disconnectTimers.get(playerId);
  if (t) { clearTimeout(t); disconnectTimers.delete(playerId); }
};

// \u2500\u2500 Health check \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// \u2500\u2500 Socket events \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

io.on('connection', (socket: Socket) => {
  console.log('[connect]', socket.id);

  socket.emit('room_list', { rooms: getAllRooms().map((r) => r.getSummary()) });

  // \u2500\u2500 create_room \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('create_room', (payload: CreateRoomPayload) => {
    try {
      const hostName = (payload.hostName ?? 'Host').trim().slice(0, 24) || 'Host';
      const bankerBalance =
        typeof payload.bankerBalance === 'number' && payload.bankerBalance > 0
          ? payload.bankerBalance
          : undefined;

      const hostId = uuidv4();
      const room = createRoom(hostId, hostName, bankerBalance);
      room.setHostSocketId(socket.id);

      socket.join(room.id);
      socketMeta.set(socket.id, { playerId: hostId, roomId: room.id, isHost: true });
      playerSocketMap.set(hostId, socket.id);

      console.log(`[create_room] ${hostName} created room ${room.id}`);
      socket.emit('room_joined', { roomState: room.getState(), yourPlayerId: hostId, isHost: true });
      broadcastRoomList();
    } catch (err) {
      console.error('[create_room]', err);
      socket.emit('error', { code: 'create_failed', message: 'Failed to create room' });
    }
  });

  // \u2500\u2500 get_rooms \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('get_rooms', () => {
    socket.emit('room_list', { rooms: getAllRooms().map((r) => r.getSummary()) });
  });

  // \u2500\u2500 join_room \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('join_room', (payload: JoinRoomPayload) => {
    try {
      const roomId = (payload.roomId ?? '').trim().toUpperCase();
      const playerName = (payload.playerName ?? 'An Danh').trim().slice(0, 24) || 'An Danh';
      const playerId = payload.playerId ?? uuidv4();
      const startingBalance =
        typeof payload.startingBalance === 'number' && payload.startingBalance > 0
          ? payload.startingBalance
          : undefined;

      const room = getRoom(roomId);
      if (!room) {
        socket.emit('error', { code: 'room_not_found', message: 'Kh\u00f4ng t\u00ecm th\u1ea5y ph\u00f2ng' });
        return;
      }

      clearTimer(playerId);

      const result = room.addPlayer(playerId, playerName, socket.id, startingBalance);
      if (!result.ok) {
        socket.emit('error', { code: result.error ?? 'join_failed', message: result.error ?? 'Cannot join' });
        return;
      }

      socket.join(roomId);
      socketMeta.set(socket.id, { playerId, roomId, isHost: false });
      playerSocketMap.set(playerId, socket.id);

      console.log(`[join_room] ${playerName} (${playerId}) joined room ${roomId}`);
      socket.emit('room_joined', { roomState: room.getState(), yourPlayerId: playerId, isHost: false });

      if (result.player) {
        socket.to(roomId).emit('player_joined', { player: result.player });
      }
      broadcastRoomList();
    } catch (err) {
      console.error('[join_room]', err);
      socket.emit('error', { code: 'join_failed', message: 'Failed to join room' });
    }
  });

  // \u2500\u2500 reconnect_player \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('reconnect_player', (payload: ReconnectPlayerPayload) => {
    try {
      const { playerId, roomId } = payload;
      if (!playerId || !roomId) return;

      clearTimer(playerId);

      const room = getRoom(roomId);
      if (!room) {
        socket.emit('error', { code: 'room_not_found', message: 'Ph\u00f2ng kh\u00f4ng c\u00f2n t\u1ed3n t\u1ea1i' });
        return;
      }

      // Host reconnecting
      if (room.hostId === playerId) {
        room.setHostSocketId(socket.id);
        socket.join(roomId);
        socketMeta.set(socket.id, { playerId, roomId, isHost: true });
        playerSocketMap.set(playerId, socket.id);
        console.log(`[reconnect] Host ${playerId} reconnected to room ${roomId}`);
        socket.emit('room_joined', { roomState: room.getState(), yourPlayerId: playerId, isHost: true });
        socket.to(roomId).emit('player_reconnected', { playerId });
        io.to(roomId).emit('room_state', room.getState());
        return;
      }

      // Regular player reconnecting
      const player = room.getPlayer(playerId);
      if (!player) {
        socket.emit('error', { code: 'player_not_found', message: 'B\u1ea1n kh\u00f4ng c\u00f2n trong ph\u00f2ng n\u00e0y' });
        return;
      }

      room.reconnectPlayer(playerId, socket.id);
      socket.join(roomId);
      socketMeta.set(socket.id, { playerId, roomId, isHost: false });
      playerSocketMap.set(playerId, socket.id);

      console.log(`[reconnect] Player ${playerId} reconnected to room ${roomId}`);
      socket.emit('room_joined', { roomState: room.getState(), yourPlayerId: playerId, isHost: false });
      socket.to(roomId).emit('player_reconnected', { playerId });
      io.to(roomId).emit('room_state', room.getState());
    } catch (err) {
      console.error('[reconnect_player]', err);
    }
  });

  // \u2500\u2500 set_balance \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('set_balance', (payload: { amount: number }) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;
      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.setBalance(meta.playerId, payload.amount);
      if (!result.ok) {
        socket.emit('error', { code: 'balance_failed', message: result.error ?? 'Cannot set balance' });
        return;
      }
      io.to(meta.roomId).emit('room_state', room.getState());
    } catch (err) { console.error('[set_balance]', err); }
  });

  // \u2500\u2500 set_bet \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('set_bet', (payload: SetBetPayload) => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;
      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.setBet(meta.playerId, payload.symbol as GameSymbol, payload.amount);
      if (!result.ok) {
        socket.emit('error', { code: 'bet_failed', message: result.error ?? 'Cannot set bet' });
        return;
      }
      const bets = room.getBetsForPlayer(meta.playerId);
      io.to(meta.roomId).emit('bets_updated', { playerId: meta.playerId, bets });
    } catch (err) { console.error('[set_bet]', err); }
  });

  // \u2500\u2500 reset_bet \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
    } catch (err) { console.error('[reset_bet]', err); }
  });

  // \u2500\u2500 confirm_bet (\u0110\u1eb7t) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('confirm_bet', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;
      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.confirmBet(meta.playerId);
      if (!result.ok) {
        socket.emit('error', { code: 'confirm_failed', message: result.error ?? 'Cannot confirm' });
        return;
      }
      console.log(`[confirm] ${meta.playerId} confirmed in room ${meta.roomId}`);
      io.to(meta.roomId).emit('player_confirmed', {
        playerId: meta.playerId,
        confirmedPlayers: room.getConfirmedPlayers(),
      });
    } catch (err) { console.error('[confirm_bet]', err); }
  });

  // \u2500\u2500 unconfirm_bet (H\u1ee7y \u0110\u1eb7t) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('unconfirm_bet', () => {
    try {
      const meta = socketMeta.get(socket.id);
      if (!meta || meta.isHost) return;
      const room = getRoom(meta.roomId);
      if (!room) return;

      const result = room.unconfirmBet(meta.playerId);
      if (!result.ok) {
        socket.emit('error', { code: 'unconfirm_failed', message: result.error ?? 'Cannot unconfirm' });
        return;
      }
      console.log(`[unconfirm] ${meta.playerId} unconfirmed in room ${meta.roomId}`);
      io.to(meta.roomId).emit('player_unconfirmed', {
        playerId: meta.playerId,
        confirmedPlayers: room.getConfirmedPlayers(),
      });
    } catch (err) { console.error('[unconfirm_bet]', err); }
  });

  // \u2500\u2500 roll_dice \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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
        const r = getRoom(meta.roomId);
        if (!r) return;
        const result = r.finishRoll();
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
    } catch (err) { console.error('[roll_dice]', err); }
  });

  // \u2500\u2500 leave_room \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('leave_room', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    socketMeta.delete(socket.id);
    playerSocketMap.delete(meta.playerId);
    clearTimer(meta.playerId);
    socket.leave(meta.roomId);

    const room = getRoom(meta.roomId);
    if (!room) return;

    if (meta.isHost) {
      const transfer = room.transferHost();
      if (transfer) {
        const newHostSid = playerSocketMap.get(transfer.newHostId);
        if (newHostSid) {
          const em = socketMeta.get(newHostSid);
          if (em) socketMeta.set(newHostSid, { ...em, isHost: true });
        }
        console.log(`[leave_room] Host left, transferred to ${transfer.newHostId}`);
        io.to(meta.roomId).emit('host_changed', {
          newHostId: transfer.newHostId,
          newHostName: transfer.newHostName,
        });
        io.to(meta.roomId).emit('room_state', room.getState());
      } else {
        io.to(meta.roomId).emit('error', {
          code: 'room_closed',
          message: 'Host \u0111\u00e3 r\u1eddi ph\u00f2ng. Ph\u00f2ng \u0111\u00e3 \u0111\u00f3ng.',
        });
        io.in(meta.roomId).socketsLeave(meta.roomId);
        deleteRoom(meta.roomId);
      }
    } else {
      room.removePlayer(meta.playerId);
      io.to(meta.roomId).emit('player_left', { playerId: meta.playerId });
      console.log(`[leave_room] Player ${meta.playerId} left room ${meta.roomId}`);
    }
    broadcastRoomList();
  });

  // \u2500\u2500 disconnect \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    socketMeta.delete(socket.id);
    // Keep playerSocketMap until timeout or reconnect

    const room = getRoom(meta.roomId);
    if (!room) return;

    if (meta.isHost) {
      room.disconnectHost();
      socket.to(meta.roomId).emit('player_disconnected', { playerId: meta.playerId, isHost: true });
      console.log(`[disconnect] Host ${meta.playerId} disconnected \u2014 timeout ${DISCONNECT_TIMEOUT_MS}ms`);

      const timer = setTimeout(() => {
        disconnectTimers.delete(meta.playerId);
        playerSocketMap.delete(meta.playerId);
        const r = getRoom(meta.roomId);
        if (!r) return;

        const transfer = r.transferHost();
        if (transfer) {
          const newHostSid = playerSocketMap.get(transfer.newHostId);
          if (newHostSid) {
            const em = socketMeta.get(newHostSid);
            if (em) socketMeta.set(newHostSid, { ...em, isHost: true });
          }
          console.log(`[timeout] Host timed out \u2014 transferred to ${transfer.newHostId}`);
          io.to(meta.roomId).emit('host_changed', {
            newHostId: transfer.newHostId,
            newHostName: transfer.newHostName,
          });
          io.to(meta.roomId).emit('room_state', r.getState());
        } else {
          console.log(`[timeout] Host timed out, no players \u2014 closing room ${meta.roomId}`);
          io.to(meta.roomId).emit('error', {
            code: 'room_closed',
            message: 'Host ng\u1eaft k\u1ebft n\u1ed1i. Ph\u00f2ng \u0111\u00e3 \u0111\u00f3ng.',
          });
          io.in(meta.roomId).socketsLeave(meta.roomId);
          deleteRoom(meta.roomId);
        }
        broadcastRoomList();
      }, DISCONNECT_TIMEOUT_MS);

      disconnectTimers.set(meta.playerId, timer);
    } else {
      room.disconnectPlayer(meta.playerId);
      socket.to(meta.roomId).emit('player_disconnected', { playerId: meta.playerId, isHost: false });
      io.to(meta.roomId).emit('room_state', room.getState());
      console.log(`[disconnect] Player ${meta.playerId} disconnected \u2014 timeout ${DISCONNECT_TIMEOUT_MS}ms`);

      const timer = setTimeout(() => {
        disconnectTimers.delete(meta.playerId);
        playerSocketMap.delete(meta.playerId);
        const r = getRoom(meta.roomId);
        if (!r) return;
        r.removePlayer(meta.playerId);
        io.to(meta.roomId).emit('player_left', { playerId: meta.playerId });
        console.log(`[timeout] Player ${meta.playerId} removed from room ${meta.roomId}`);
        broadcastRoomList();
      }, DISCONNECT_TIMEOUT_MS);

      disconnectTimers.set(meta.playerId, timer);
    }
  });
});

// \u2500\u2500 Start server \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🎲 Bầu Cua server running on port ${PORT}\n`);
});

