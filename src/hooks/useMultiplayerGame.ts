import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppStore';
import { connectSocket, getSocket } from '../lib/socket';
import {
  clearError,
  hideResult,
  leaveRoom,
} from '../features/game/multiplayerSlice';
import { useSoundEffects } from './useSoundEffects';
import type { GameSymbol } from '../types/multiplayer';

const PLAYER_ID_KEY = 'bau-cua-player-id';
const PLAYER_NAME_KEY = 'bau-cua-player-name';
const LAST_ROOM_KEY = 'bau-cua-last-room';

export function useMultiplayerGame() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.multiplayer);
  const sounds = useSoundEffects();

  // ���� Actions ����������������������������������������������������������������������������������������������������������������������������

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const createRoom = useCallback((hostName: string, bankerBalance?: number) => {
    const socket = connectSocket();
    localStorage.setItem(PLAYER_NAME_KEY, hostName);
    socket.emit('create_room', { hostName, bankerBalance });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string, startingBalance?: number) => {
    const socket = connectSocket();
    const existingId = localStorage.getItem(PLAYER_ID_KEY) ?? undefined;
    localStorage.setItem(PLAYER_NAME_KEY, playerName);
    socket.emit('join_room', {
      roomId: roomId.toUpperCase(),
      playerName,
      playerId: existingId,
      startingBalance,
    });
  }, []);

  const getRooms = useCallback(() => {
    const socket = getSocket();
    socket.emit('get_rooms');
  }, []);

  /** Set bet amount for a specific symbol */
  const setBet = useCallback(
    (symbol: GameSymbol, amount: number) => {
      if (state.isHost) return;
      getSocket().emit('set_bet', { symbol, amount });
    },
    [state.isHost]
  );

  const resetBets = useCallback(() => {
    if (state.isHost) return;
    getSocket().emit('reset_bet');
  }, [state.isHost]);

  const confirmBet = useCallback(() => {
    if (state.isHost) return;
    sounds.playBet?.();
    getSocket().emit('confirm_bet');
  }, [state.isHost, sounds]);

  const unconfirmBet = useCallback(() => {
    if (state.isHost) return;
    getSocket().emit('unconfirm_bet');
  }, [state.isHost]);

  const rollDice = useCallback(() => {
    if (!state.isHost) return;
    sounds.playRoll();
    getSocket().emit('roll_dice');
  }, [state.isHost, sounds]);

  const doHideResult = useCallback(() => {
    dispatch(hideResult());
  }, [dispatch]);

  const doLeaveRoom = useCallback(() => {
    dispatch(leaveRoom());
    getSocket().emit('leave_room');
    localStorage.removeItem(LAST_ROOM_KEY);
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleResultSound = useCallback(() => {
    const myResult = state.lastResults.find((r) => r.playerId === state.playerId);
    if (myResult && myResult.profit > 0) {
      sounds.playWin();
    } else if (myResult && myResult.profit < 0) {
      sounds.playLose();
    }
  }, [state.lastResults, state.playerId, sounds]);

  // ���� Computed ��������������������������������������������������������������������������������������������������������������������������

  const myPlayer = state.players.find((p) => p.id === state.playerId);
  const isConfirmed = state.confirmedPlayers.includes(state.playerId ?? '');
  const totalBetAmount = Object.values(state.myBets).reduce((a, b) => a + b, 0);
  const myResult = state.lastResults.find((r) => r.playerId === state.playerId);
  const canRoll =
    state.isHost &&
    state.status !== 'rolling' &&
    state.confirmedPlayers.length > 0 &&
    !state.isRolling;

  return {
    // State
    ...state,
    myPlayer,
    isConfirmed,
    totalBetAmount,
    myResult,
    canRoll,

    // Actions
    connect,
    createRoom,
    joinRoom,
    getRooms,
    setBet,
    resetBets,
    confirmBet,
    unconfirmBet,
    rollDice,
    hideResult: doHideResult,
    leaveRoom: doLeaveRoom,
    dismissError,
    handleResultSound,
  };
}

