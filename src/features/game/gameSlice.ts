import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameState, GameSymbol } from '../../types/game';
import {
  ALL_SYMBOLS,
  BET_STEP,
  DICE_COUNT,
  INITIAL_BALANCE,
  STORAGE_KEY,
} from '../../constants/symbols';

const loadBalanceFromStorage = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  return INITIAL_BALANCE;
};

const saveBalanceToStorage = (balance: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY, String(balance));
  } catch {
    /* ignore */
  }
};

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce(
    (acc, sym) => ({ ...acc, [sym]: 0 }),
    {} as Record<GameSymbol, number>
  );

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const calcTotalBet = (bets: Record<GameSymbol, number>): number =>
  Object.values(bets).reduce((a, b) => a + b, 0);

/**
 * Standard Bầu Cua rules:
 *  - All bets deducted upfront at rollStart
 *  - Each die that shows your symbol: you earn bet[symbol] (1:1 payout)
 *  - The original bet on winning symbols is also returned
 *  - winAmount = pure profit shown to user
 */
const calcWinnings = (
  bets: Record<GameSymbol, number>,
  dice: GameSymbol[]
): { winAmount: number; totalReturn: number } => {
  let winAmount = 0;
  let totalReturn = 0;
  for (const symbol of ALL_SYMBOLS) {
    const bet = bets[symbol];
    if (bet <= 0) continue;
    const matchCount = dice.filter((d) => d === symbol).length;
    if (matchCount > 0) {
      const profit = bet * matchCount;
      winAmount += profit;
      totalReturn += profit + bet; // profit + refund of original bet
    }
  }
  return { winAmount, totalReturn };
};

const savedBalance = loadBalanceFromStorage();

const initialState: GameState = {
  balance: savedBalance,
  bets: emptyBets(),
  dice: [randomSymbol(), randomSymbol(), randomSymbol()],
  isRolling: false,
  lastResult: null,
  winAmount: 0,
  totalBet: 0,
  showResult: false,
  previousBalance: savedBalance,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addBet(state, action: PayloadAction<GameSymbol>) {
      const symbol = action.payload;
      const currentTotalBet = calcTotalBet(state.bets);
      if (state.balance - currentTotalBet >= BET_STEP) {
        state.bets[symbol] += BET_STEP;
      }
    },

    removeBet(state, action: PayloadAction<GameSymbol>) {
      const symbol = action.payload;
      if (state.bets[symbol] >= BET_STEP) {
        state.bets[symbol] -= BET_STEP;
      }
    },

    rollStart(state) {
      const bet = calcTotalBet(state.bets);
      if (bet <= 0 || state.balance < bet) return;
      state.previousBalance = state.balance;
      state.balance -= bet;
      state.totalBet = bet;
      state.isRolling = true;
      state.lastResult = null;
      state.winAmount = 0;
      state.showResult = false;
      saveBalanceToStorage(state.balance);
    },

    rollEnd(state, action: PayloadAction<GameSymbol[]>) {
      state.dice = action.payload.slice(0, DICE_COUNT);
      state.isRolling = false;
    },

    calculateResult(state) {
      const { winAmount, totalReturn } = calcWinnings(state.bets, state.dice);
      state.winAmount = winAmount;
      state.balance += totalReturn;
      state.lastResult = winAmount > 0 ? 'win' : 'lose';
      state.showResult = true;
      saveBalanceToStorage(state.balance);
    },

    resetBets(state) {
      state.bets = emptyBets();
      state.totalBet = 0;
    },

    resetGame(state) {
      state.balance = INITIAL_BALANCE;
      state.bets = emptyBets();
      state.dice = [randomSymbol(), randomSymbol(), randomSymbol()];
      state.isRolling = false;
      state.lastResult = null;
      state.winAmount = 0;
      state.totalBet = 0;
      state.showResult = false;
      state.previousBalance = INITIAL_BALANCE;
      saveBalanceToStorage(INITIAL_BALANCE);
    },

    hideResult(state) {
      state.showResult = false;
      state.lastResult = null;
    },

    loadBalance(state) {
      state.balance = loadBalanceFromStorage();
      state.previousBalance = state.balance;
    },
  },
});

export const {
  addBet,
  removeBet,
  rollStart,
  rollEnd,
  calculateResult,
  resetBets,
  resetGame,
  hideResult,
  loadBalance,
} = gameSlice.actions;

export default gameSlice.reducer;
