import { useEffect } from 'react';
import { useAppDispatch } from './useAppStore';
import { getSocket } from '../lib/socket';
import {
  setConnected,
  setError,
  setRoomList,
  roomJoined,
  playerJoined,
  playerLeft,
  betsUpdated,
  readyUpdate,
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
    };
    const onDisconnect = () => {
      dispatch(setConnected(false));
    };

    const onRoomList = (payload: RoomListPayload) => {
      dispatch(setRoomList(payload.rooms));
    };

    // Storing pending name for roomJoined  we store it in a closure via pendingName
    const onRoomJoined = (payload: RoomJoinedPayload) => {
      const savedName = localStorage.getItem('bau-cua-player-name') ?? 'Ẩn Danh';
      dispatch(roomJoined({
        roomState: payload.roomState,
        yourPlayerId: payload.yourPlayerId,
        isHost: payload.isHost,
        playerName: savedName,
      }));
    };

    const onPlayerJoined = (payload: { player: Player }) => {
      dispatch(playerJoined(payload.player));
    };

    const onPlayerLeft = (payload: { playerId: string }) => {
      dispatch(playerLeft(payload.playerId));
    };

    const onBetsUpdated = (payload: { playerId: string; bets: Record<GameSymbol, number> }) => {
      dispatch(betsUpdated(payload));
    };

    const onReadyUpdate = (payload: { playerId: string; readyPlayers: string[] }) => {
      dispatch(readyUpdate(payload));
    };

    const onDiceRolling = (payload: DiceRollingPayload) => {
      dispatch(setRolling(payload.roomState));
    };

    const onDiceResult = (payload: DiceResultPayload) => {
      dispatch(diceResult(payload));
    };

    const onError = (payload: ErrorPayload) => {
      if (payload.code === 'host_left') {
        dispatch(leaveRoom());
      }
      dispatch(setError(payload.message));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('bets_updated', onBetsUpdated);
    socket.on('player_ready_update', onReadyUpdate);
    socket.on('dice_rolling', onDiceRolling);
    socket.on('dice_result', onDiceResult);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('bets_updated', onBetsUpdated);
      socket.off('player_ready_update', onReadyUpdate);
      socket.off('dice_rolling', onDiceRolling);
      socket.off('dice_result', onDiceResult);
      socket.off('error', onError);
    };
  }, [dispatch]);
}
