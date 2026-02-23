import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useAppStore';
import { getSocket, connectSocket } from '../lib/socket';
import {
  setPlayerIdentity,
  hideResult,
} from '../features/game/multiplayerSlice';
import type { GameSymbol } from '../types/multiplayer';
import { useSoundEffects } from './useSoundEffects';

export const useMultiplayerGame = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.multiplayer);
  const { playBet, playRoll, playWin, playLose } = useSoundEffects();

  // ── Join ───────────────────────────────────────────────────────────────────
  const joinGame = useCallback(
    (playerName: string, existingPlayerId?: string) => {
      const socket = connectSocket();
      const trimmed = playerName.trim();
      if (!trimmed) return;

      dispatch(setPlayerIdentity({ playerId: existingPlayerId ?? '', playerName: trimmed }));

      socket.emit('join_game', {
        playerName: trimmed,
        playerId: existingPlayerId,
      });
    },
    [dispatch]
  );

  // ── Bet ────────────────────────────────────────────────────────────────────
  const addBet = useCallback(
    (symbol: GameSymbol) => {
      if (state.isRolling) return;
      const socket = getSocket();
      socket.emit('place_bet', { symbol });
      playBet();
    },
    [state.isRolling, playBet]
  );

  const removeBet = useCallback(
    (symbol: GameSymbol) => {
      if (state.isRolling) return;
      const socket = getSocket();
      socket.emit('remove_bet', { symbol });
    },
    [state.isRolling]
  );

  const resetBets = useCallback(() => {
    if (state.isRolling) return;
    getSocket().emit('reset_bet');
  }, [state.isRolling]);

  // ── Roll ───────────────────────────────────────────────────────────────────
  const rollDice = useCallback(() => {
    const totalBet = Object.values(state.myBets).reduce((a, b) => a + b, 0);
    const me = state.players.find((p) => p.id === state.playerId);
    if (state.isRolling || totalBet === 0 || !me || me.balance < totalBet) return;

    getSocket().emit('roll_dice');
    playRoll();
  }, [state.isRolling, state.myBets, state.players, state.playerId, playRoll]);

  // ── Result sounds (triggered when dice_result arrives) ────────────────────
  const handleResultSound = useCallback(() => {
    if (!state.playerId) return;
    const myResult = state.lastResults.find((r) => r.playerId === state.playerId);
    if (myResult && myResult.winAmount > 0) {
      playWin();
    } else if (myResult && myResult.totalBet > 0) {
      playLose();
    }
  }, [state.playerId, state.lastResults, playWin, playLose]);

  const handleHideResult = useCallback(() => {
    dispatch(hideResult());
  }, [dispatch]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const myPlayer = state.players.find((p) => p.id === state.playerId);
  const totalBetAmount = Object.values(state.myBets).reduce((a, b) => a + b, 0);
  const canRoll =
    !state.isRolling && totalBetAmount > 0 && !!myPlayer && myPlayer.balance >= totalBetAmount;

  const myResult = state.lastResults.find((r) => r.playerId === state.playerId) ?? null;

  return {
    // Identity
    playerId: state.playerId,
    playerName: state.playerName,
    hasJoined: state.hasJoined,
    connected: state.connected,

    // Room
    phase: state.phase,
    players: state.players,
    allBets: state.allBets,
    myBets: state.myBets,
    bankerBalance: state.bankerBalance,
    bankerDelta: state.bankerDelta,

    // Dice
    dice: state.dice,
    isRolling: state.isRolling,

    // History
    history: state.history,
    currentRound: state.currentRound,

    // Results
    lastResults: state.lastResults,
    showResult: state.showResult,
    myResult,

    // Derived
    myPlayer,
    totalBetAmount,
    canRoll,

    // Error
    error: state.error,

    // Actions
    joinGame,
    addBet,
    removeBet,
    resetBets,
    rollDice,
    handleResultSound,
    hideResult: handleHideResult,
  };
};
