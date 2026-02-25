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

export function useMultiplayerGame() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.multiplayer);
  const sounds = useSoundEffects();

  //  Actions

  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const createRoom = useCallback((hostName: string) => {
    const socket = connectSocket();
    localStorage.setItem('bau-cua-player-name', hostName);
    socket.emit('create_room', { hostName });
  }, []);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    const socket = connectSocket();
    const existingId = localStorage.getItem('bau-cua-player-id') ?? undefined;
    localStorage.setItem('bau-cua-player-name', playerName);
    socket.emit('join_room', { roomId: roomId.toUpperCase(), playerName, playerId: existingId });
  }, []);

  const getRooms = useCallback(() => {
    const socket = getSocket();
    socket.emit('get_rooms');
  }, []);

  const addBet = useCallback(
    (symbol: GameSymbol) => {
      if (state.isHost) return;
      sounds.playBet();
      getSocket().emit('place_bet', { symbol });
    },
    [state.isHost, sounds]
  );

  const removeBet = useCallback(
    (symbol: GameSymbol) => {
      if (state.isHost) return;
      getSocket().emit('remove_bet', { symbol });
    },
    [state.isHost]
  );

  const resetBets = useCallback(() => {
    if (state.isHost) return;
    getSocket().emit('reset_bet');
  }, [state.isHost]);

  const setReady = useCallback(() => {
    if (state.isHost) return;
    getSocket().emit('player_ready');
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
  }, [dispatch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleResultSound = useCallback(() => {
    const myResult = state.lastResults.find((r) => r.playerId === state.playerId);
    if (myResult && myResult.winAmount > 0) {
      sounds.playWin();
    } else if (myResult && myResult.totalBet > 0) {
      sounds.playLose();
    }
  }, [state.lastResults, state.playerId, sounds]);

  //  Computed

  const myPlayer = state.players.find((p) => p.id === state.playerId);
  const isReady = state.readyPlayers.includes(state.playerId ?? '');
  const totalBetAmount = Object.values(state.myBets).reduce((a, b) => a + b, 0);
  const myResult = state.lastResults.find((r) => r.playerId === state.playerId);
  const canRoll =
    state.isHost &&
    state.status !== 'rolling' &&
    state.readyPlayers.length > 0 &&
    !state.isRolling;

  return {
    // State
    ...state,
    myPlayer,
    isReady,
    totalBetAmount,
    myResult,
    canRoll,

    // Actions
    connect,
    createRoom,
    joinRoom,
    getRooms,
    addBet,
    removeBet,
    resetBets,
    setReady,
    rollDice,
    hideResult: doHideResult,
    leaveRoom: doLeaveRoom,
    dismissError,
    handleResultSound,
  };
}
