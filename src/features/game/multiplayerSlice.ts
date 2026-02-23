import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  MultiplayerState,
  Player,
  RoomState,
  RoundHistory,
  RoundResult,
  GameSymbol,
} from '../../types/multiplayer';
import { ALL_SYMBOLS } from '../../constants/symbols';

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<GameSymbol, number>);

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const initialState: MultiplayerState = {
  playerId: null,
  playerName: null,
  hasJoined: false,

  phase: 'betting',
  players: [],
  allBets: {},
  myBets: emptyBets(),
  bankerBalance: 1_000_000,
  bankerDelta: null,

  dice: [randomSymbol(), randomSymbol(), randomSymbol()],
  isRolling: false,

  history: [],
  currentRound: 0,

  lastResults: [],
  showResult: false,

  connected: false,
  error: null,
};

const multiplayerSlice = createSlice({
  name: 'multiplayer',
  initialState,
  reducers: {
    // ── Connection ────────────────────────────────────────────────────────────
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (!action.payload) state.hasJoined = false;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    // ── Join ──────────────────────────────────────────────────────────────────
    setPlayerIdentity(state, action: PayloadAction<{ playerId: string; playerName: string }>) {
      state.playerId = action.payload.playerId;
      state.playerName = action.payload.playerName;
    },

    setHasJoined(state, action: PayloadAction<boolean>) {
      state.hasJoined = action.payload;
    },

    // ── Full room state sync (on join) ────────────────────────────────────────
    syncRoomState(
      state,
      action: PayloadAction<{ roomState: RoomState; yourPlayerId: string }>
    ) {
      const { roomState, yourPlayerId } = action.payload;
      state.playerId = yourPlayerId;
      state.phase = roomState.phase;
      state.players = roomState.players;
      state.allBets = roomState.bets;
      state.myBets = roomState.bets[yourPlayerId] ?? emptyBets();
      state.bankerBalance = roomState.bankerBalance;
      state.dice = roomState.dice;
      state.history = roomState.history;
      state.currentRound = roomState.currentRound;
      state.hasJoined = true;
      state.isRolling = roomState.phase === 'rolling';
      // Persist player ID for reconnection
      try { localStorage.setItem('bau-cua-player-id', yourPlayerId); } catch { /* ignore */ }
    },

    // ── Players ───────────────────────────────────────────────────────────────
    playerJoined(state, action: PayloadAction<{ player: Player }>) {
      const exists = state.players.find((p) => p.id === action.payload.player.id);
      if (!exists) {
        state.players.push(action.payload.player);
      } else {
        Object.assign(exists, action.payload.player);
      }
    },

    playerLeft(state, action: PayloadAction<{ playerId: string }>) {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) player.isConnected = false;
    },

    updatePlayers(state, action: PayloadAction<Player[]>) {
      state.players = action.payload;
    },

    // ── Bets ──────────────────────────────────────────────────────────────────
    betsUpdated(
      state,
      action: PayloadAction<{ playerId: string; bets: Record<GameSymbol, number> }>
    ) {
      const { playerId, bets } = action.payload;
      state.allBets = { ...state.allBets, [playerId]: bets };
      if (state.playerId === playerId) {
        state.myBets = bets;
      }
    },

    // ── Rolling ───────────────────────────────────────────────────────────────
    setRolling(state) {
      state.isRolling = true;
      state.phase = 'rolling';
      state.showResult = false;
      state.error = null;
    },

    // ── Result ────────────────────────────────────────────────────────────────
    diceResult(
      state,
      action: PayloadAction<{
        dice: GameSymbol[];
        results: RoundResult[];
        history: RoundHistory;
        bankerBalance: number;
        updatedPlayers: Player[];
      }>
    ) {
      const { dice, results, history, bankerBalance, updatedPlayers } = action.payload;

      state.dice = dice;
      state.isRolling = false;
      state.phase = 'betting';
      state.lastResults = results;
      state.showResult = true;
      state.bankerBalance = bankerBalance;
      state.bankerDelta = history.bankerDelta;
      state.players = updatedPlayers;
      state.currentRound = history.roundNumber;

      // Update balances in player list and myBets reset
      if (state.playerId) {
        state.myBets = emptyBets();
        state.allBets = { ...state.allBets, [state.playerId]: emptyBets() };
      }

      // Prepend to history
      state.history = [history, ...state.history].slice(0, 50);
    },

    hideResult(state) {
      state.showResult = false;
    },
  },
});

export const {
  setConnected,
  setError,
  setPlayerIdentity,
  setHasJoined,
  syncRoomState,
  playerJoined,
  playerLeft,
  updatePlayers,
  betsUpdated,
  setRolling,
  diceResult,
  hideResult,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
