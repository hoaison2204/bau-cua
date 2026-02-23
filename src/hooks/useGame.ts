import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useAppStore';
import {
  addBet,
  removeBet,
  rollStart,
  rollEnd,
  calculateResult,
  resetBets,
  resetGame,
  hideResult,
} from '../features/game/gameSlice';
import type { GameSymbol } from '../types/game';
import { ALL_SYMBOLS, DICE_COUNT, ROLL_DURATION_MS } from '../constants/symbols';
import { useSoundEffects } from './useSoundEffects';

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const rollDiceSymbols = (): GameSymbol[] =>
  Array.from({ length: DICE_COUNT }, () => randomSymbol());

export const useGame = () => {
  const dispatch = useAppDispatch();
  const { balance, bets, dice, isRolling, lastResult, winAmount, totalBet, showResult } =
    useAppSelector((state) => state.game);
  const { playBet, playRoll, playWin, playLose } = useSoundEffects();
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    };
  }, []);

  const handleAddBet = useCallback(
    (symbol: GameSymbol) => {
      if (!isRolling) {
        dispatch(addBet(symbol));
        playBet();
      }
    },
    [dispatch, isRolling, playBet]
  );

  const handleRemoveBet = useCallback(
    (symbol: GameSymbol) => {
      if (!isRolling) {
        dispatch(removeBet(symbol));
      }
    },
    [dispatch, isRolling]
  );

  const handleRollDice = useCallback(() => {
    const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);
    if (isRolling || totalBetAmount === 0 || balance < totalBetAmount) return;

    dispatch(rollStart());
    playRoll();

    const finalDice = rollDiceSymbols();

    rollTimeoutRef.current = setTimeout(() => {
      dispatch(rollEnd(finalDice));
      dispatch(calculateResult());

      // Sound after result
      setTimeout(() => {
        const win = finalDice.reduce((acc, die) => {
          return acc + (bets[die] > 0 ? bets[die] : 0);
        }, 0);
        if (win > 0) {
          playWin();
        } else {
          playLose();
        }
      }, 100);
    }, ROLL_DURATION_MS);
  }, [dispatch, bets, balance, isRolling, playRoll, playWin, playLose]);

  const handleResetBets = useCallback(() => {
    if (!isRolling) dispatch(resetBets());
  }, [dispatch, isRolling]);

  const handleResetGame = useCallback(() => {
    if (!isRolling) dispatch(resetGame());
  }, [dispatch, isRolling]);

  const handleHideResult = useCallback(() => {
    dispatch(hideResult());
  }, [dispatch]);

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);
  const canRoll = !isRolling && totalBetAmount > 0 && balance >= totalBetAmount;

  return {
    balance,
    bets,
    dice,
    isRolling,
    lastResult,
    winAmount,
    totalBet,
    showResult,
    canRoll,
    totalBetAmount,
    rollDice: handleRollDice,
    addBet: handleAddBet,
    removeBet: handleRemoveBet,
    resetBets: handleResetBets,
    resetGame: handleResetGame,
    hideResult: handleHideResult,
  };
};
