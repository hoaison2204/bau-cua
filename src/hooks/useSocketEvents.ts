import { useEffect } from 'react';
import { useAppDispatch } from './useAppStore';
import { getSocket } from '../lib/socket';
import {
  setConnected,
  setError,
  setRoomList,
  roomJoined,
  roomStateUpdated,
  hostChanged,
  playerJoined,
  playerLeft,
  playerReconnected,
  playerDisconnected,
  betsUpdated,
  confirmedUpdate,
  setRolling,
  diceResult,
  leaveRoom,
} from '../features/game/multiplayerSlice';
import type {
  RoomState,
  Player,
  RoomSummary,
  RoundPlayerResult,
  RoundHistory,
  GameSymbol,
} from '../types/multiplayer';

interface RoomListPayload { rooms: RoomSummary[] }
interface RoomJoinedPayload { roomState: RoomState; yourPlayerId: string; isHost: boolean }
interface DiceRollingPayload { roomState: RoomState }
interface DiceResultPayload {
  dice: GameSymbol[];
  results: RoundPlayerResult[];
  history: RoundHistory;
  bankerBalance: number;
  updatedPlayers: Player[];
}
interface ErrorPayload { code: string; message: string }

export function useSocketEvents() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      dispatch(setConnected(true));
      // Auto-reconnect: if we have saved session, attempt to restore it
      const playerId = localStorage.getItem('bau-cua-player-id');
      const roomId = localStorage.getItem('bau-cua-last-room');
      if (playerId && roomId) {
        socket.emit('reconnect_player', { playerId, roomId });
      }
    };

    const onDisconnect = () => {
      dispatch(setConnected(false));
    };

    const onRoomList = (payload: RoomListPayload) => {
      dispatch(setRoomList(payload.rooms));
    };

    const onRoomJoined = (payload: RoomJoinedPayload) => {
      const savedName = localStorage.getItem('bau-cua-player-name') ?? '?n Danh';
      dispatch(roomJoined({
        roomState: payload.roomState,
        yourPlayerId: payload.yourPlayerId,
        isHost: payload.isHost,
        playerName: savedName,
      }));
    };

    const onRoomState = (roomState: RoomState) => {
      dispatch(roomStateUpdated(roomState));
    };

    const onHostChanged = (payload: { newHostId: string; newHostName: string }) => {
      dispatch(hostChanged(payload));
    };

    const onPlayerJoined = (payload: { player: Player }) => {
      dispatch(playerJoined(payload.player));
    };

    const onPlayerLeft = (payload: { playerId: string }) => {
      dispatch(playerLeft(payload.playerId));
    };

    const onPlayerReconnected = (payload: { playerId: string }) => {
      dispatch(playerReconnected(payload.playerId));
    };

    const onPlayerDisconnected = (payload: { playerId: string }) => {
      dispatch(playerDisconnected(payload.playerId));
    };

    const onBetsUpdated = (payload: { playerId: string; bets: Record<GameSymbol, number> }) => {
      dispatch(betsUpdated(payload));
    };

    const onPlayerConfirmed = (payload: { playerId: string; confirmedPlayers: string[] }) => {
      dispatch(confirmedUpdate(payload));
    };

    const onPlayerUnconfirmed = (payload: { playerId: string; confirmedPlayers: string[] }) => {
      dispatch(confirmedUpdate(payload));
    };

    const onDiceRolling = (payload: DiceRollingPayload) => {
      dispatch(setRolling(payload.roomState));
    };

    const onDiceResult = (payload: DiceResultPayload) => {
      dispatch(diceResult(payload));
    };

    const onError = (payload: ErrorPayload) => {
      if (payload.code === 'room_closed' || payload.code === 'host_left') {
        dispatch(leaveRoom());
        localStorage.removeItem('bau-cua-last-room');
      }
      dispatch(setError(payload.message));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_state', onRoomState);
    socket.on('host_changed', onHostChanged);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('player_reconnected', onPlayerReconnected);
    socket.on('player_disconnected', onPlayerDisconnected);
    socket.on('bets_updated', onBetsUpdated);
    socket.on('player_confirmed', onPlayerConfirmed);
    socket.on('player_unconfirmed', onPlayerUnconfirmed);
    socket.on('dice_rolling', onDiceRolling);
    socket.on('dice_result', onDiceResult);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_state', onRoomState);
      socket.off('host_changed', onHostChanged);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('player_reconnected', onPlayerReconnected);
      socket.off('player_disconnected', onPlayerDisconnected);
      socket.off('bets_updated', onBetsUpdated);
      socket.off('player_confirmed', onPlayerConfirmed);
      socket.off('player_unconfirmed', onPlayerUnconfirmed);
      socket.off('dice_rolling', onDiceRolling);
      socket.off('dice_result', onDiceResult);
      socket.off('error', onError);
    };
  }, [dispatch]);
}
