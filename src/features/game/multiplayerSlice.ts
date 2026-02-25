import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  MultiplayerState,
  Player,
  RoomState,
  RoomSummary,
  RoundHistory,
  RoundPlayerResult,
  GameSymbol,
} from '../../types/multiplayer';
import { ALL_SYMBOLS } from '../../constants/symbols';

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<GameSymbol, number>);

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const initialState: MultiplayerState = {
  screen: 'lobby',
  connected: false,
  error: null,

  playerId: null,
  playerName: null,
  isHost: false,

  roomId: null,
  hostId: null,
  hostName: null,
  status: 'waiting',
  bankerBalance: 1_000_000,
  bankerDelta: null,
  players: [],
  allBets: {},
  myBets: emptyBets(),
  readyPlayers: [],
  dice: [randomSymbol(), randomSymbol(), randomSymbol()],
  history: [],
  currentRound: 0,
  isRolling: false,

  lastResults: [],
  showResult: false,

  rooms: [],
};

const multiplayerSlice = createSlice({
  name: 'multiplayer',
  initialState,
  reducers: {
    //  Connection
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (!action.payload) {
        state.screen = 'lobby';
        state.roomId = null;
        state.isHost = false;
      }
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    clearError(state) {
      state.error = null;
    },

    //  Room list
    setRoomList(state, action: PayloadAction<RoomSummary[]>) {
      state.rooms = action.payload;
    },

    //  Room joined (create or join)
    roomJoined(
      state,
      action: PayloadAction<{ roomState: RoomState; yourPlayerId: string; isHost: boolean; playerName: string }>
    ) {
      const { roomState, yourPlayerId, isHost, playerName } = action.payload;
      state.screen = 'room';
      state.playerId = yourPlayerId;
      state.playerName = playerName;
      state.isHost = isHost;

      state.roomId = roomState.id;
      state.hostId = roomState.hostId;
      state.hostName = roomState.hostName;
      state.status = roomState.status;
      state.bankerBalance = roomState.bankerBalance;
      state.players = roomState.players;
      state.allBets = roomState.bets;
      state.myBets = roomState.bets[yourPlayerId] ?? emptyBets();
      state.readyPlayers = roomState.readyPlayers;
      state.dice = roomState.dice;
      state.history = roomState.history;
      state.currentRound = roomState.currentRound;

      localStorage.setItem('bau-cua-player-id', yourPlayerId);
      localStorage.setItem('bau-cua-player-name', playerName);
    },

    //  Player joined
    playerJoined(state, action: PayloadAction<Player>) {
      const exists = state.players.find((p) => p.id === action.payload.id);
      if (!exists) state.players.push(action.payload);
      // When a player joins, the room is now in betting phase
      if (state.status === 'waiting') state.status = 'betting';
    },

    //  Player left
    playerLeft(state, action: PayloadAction<string>) {
      // Remove from list and clean up their bets/ready state
      state.players = state.players.filter((p) => p.id !== action.payload);
      delete state.allBets[action.payload];
      state.readyPlayers = state.readyPlayers.filter((id) => id !== action.payload);
    },

    //  Bets updated
    betsUpdated(
      state,
      action: PayloadAction<{ playerId: string; bets: Record<GameSymbol, number> }>
    ) {
      const { playerId, bets } = action.payload;
      state.allBets = { ...state.allBets, [playerId]: bets };
      if (playerId === state.playerId) {
        state.myBets = bets;
      }
    },

    //  Ready update
    readyUpdate(
      state,
      action: PayloadAction<{ playerId: string; readyPlayers: string[] }>
    ) {
      state.readyPlayers = action.payload.readyPlayers;
      state.players = state.players.map((p) => ({
        ...p,
        isReady: action.payload.readyPlayers.includes(p.id),
      }));
    },

    //  Rolling
    setRolling(state, action: PayloadAction<RoomState>) {
      state.isRolling = true;
      state.showResult = false;
      state.status = 'rolling';
      state.players = action.payload.players;
    },

    //  Dice result
    diceResult(
      state,
      action: PayloadAction<{
        dice: GameSymbol[];
        results: RoundPlayerResult[];
        history: RoundHistory;
        bankerBalance: number;
        updatedPlayers: Player[];
      }>
    ) {
      const { dice, results, history, bankerBalance, updatedPlayers } = action.payload;
      const prevBanker = state.bankerBalance;

      state.isRolling = false;
      state.status = 'betting';
      state.dice = dice;
      state.players = updatedPlayers;
      state.bankerBalance = bankerBalance;
      state.bankerDelta = bankerBalance - prevBanker;
      state.history = [history, ...state.history].slice(0, 50);
      state.currentRound += 1;
      state.readyPlayers = [];
      state.allBets = {};
      state.myBets = emptyBets();

      state.lastResults = results;
      state.showResult = true;
    },

    //  Hide result
    hideResult(state) {
      state.showResult = false;
    },

    //  Leave room
    leaveRoom(state) {
      state.screen = 'lobby';
      state.roomId = null;
      state.hostId = null;
      state.hostName = null;
      state.isHost = false;
      state.players = [];
      state.allBets = {};
      state.myBets = emptyBets();
      state.readyPlayers = [];
      state.history = [];
      state.isRolling = false;
      state.showResult = false;
      state.status = 'waiting';
    },
  },
});

export const {
  setConnected,
  setError,
  clearError,
  setRoomList,
  roomJoined,
  playerJoined,
  playerLeft,
  betsUpdated,
  readyUpdate,
  setRolling,
  diceResult,
  hideResult,
  leaveRoom,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
