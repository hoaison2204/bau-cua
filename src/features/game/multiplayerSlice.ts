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
  isReconnecting: false,

  playerId: null,
  playerName: null,
  isHost: false,

  roomId: null,
  hostId: null,
  hostName: null,
  status: 'waiting',
  bankerBalance: 10_000_000,
  bankerDelta: null,
  players: [],
  allBets: {},
  myBets: emptyBets(),
  confirmedPlayers: [],
  dice: [randomSymbol(), randomSymbol(), randomSymbol()],
  history: [],
  currentRound: 0,
  isRolling: false,

  lastResults: [],
  showResult: false,

  rooms: [],
};

const applyRoomState = (state: MultiplayerState, roomState: RoomState) => {
  state.roomId = roomState.id;
  state.hostId = roomState.hostId;
  state.hostName = roomState.hostName;
  state.status = roomState.status;
  state.bankerBalance = roomState.bankerBalance;
  state.players = roomState.players;
  state.allBets = roomState.bets;
  state.myBets = roomState.bets[state.playerId ?? ''] ?? emptyBets();
  state.confirmedPlayers = roomState.confirmedPlayers;
  state.dice = roomState.dice;
  state.history = roomState.history;
  state.currentRound = roomState.currentRound;
  if (roomState.status !== 'rolling') state.isRolling = false;
};

const multiplayerSlice = createSlice({
  name: 'multiplayer',
  initialState,
  reducers: {
    // ���� Connection ��������������������������������������������������������������������������������������������������������������������
    setConnected(state, action: PayloadAction<boolean>) {
      state.connected = action.payload;
      if (!action.payload && !state.isReconnecting) {
        // Don't immediately wipe room state ? allow for reconnect window
      }
    },

    setReconnecting(state, action: PayloadAction<boolean>) {
      state.isReconnecting = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    clearError(state) {
      state.error = null;
    },

    // ���� Room list ����������������������������������������������������������������������������������������������������������������������
    setRoomList(state, action: PayloadAction<RoomSummary[]>) {
      state.rooms = action.payload;
    },

    // ���� Room joined (create / join / reconnect) ����������������������������������������������������������
    roomJoined(
      state,
      action: PayloadAction<{ roomState: RoomState; yourPlayerId: string; isHost: boolean; playerName: string }>
    ) {
      const { roomState, yourPlayerId, isHost, playerName } = action.payload;
      state.screen = 'room';
      state.playerId = yourPlayerId;
      state.playerName = playerName;
      state.isHost = isHost;
      state.isReconnecting = false;

      applyRoomState(state, roomState);

      localStorage.setItem('bau-cua-player-id', yourPlayerId);
      localStorage.setItem('bau-cua-player-name', playerName);
      if (roomState.id) localStorage.setItem('bau-cua-last-room', roomState.id);
    },

    // ���� Full room state update ��������������������������������������������������������������������������������������������
    roomStateUpdated(state, action: PayloadAction<RoomState>) {
      applyRoomState(state, action.payload);
    },

    // ���� Host changed ����������������������������������������������������������������������������������������������������������������
    hostChanged(
      state,
      action: PayloadAction<{ newHostId: string; newHostName: string }>
    ) {
      state.hostId = action.payload.newHostId;
      state.hostName = action.payload.newHostName;
      // If we are the new host, update isHost flag
      if (state.playerId === action.payload.newHostId) {
        state.isHost = true;
      }
    },

    // ���� Player joined ��������������������������������������������������������������������������������������������������������������
    playerJoined(state, action: PayloadAction<Player>) {
      const exists = state.players.find((p) => p.id === action.payload.id);
      if (!exists) state.players.push(action.payload);
      if (state.status === 'waiting') state.status = 'betting';
    },

    // ���� Player left ������������������������������������������������������������������������������������������������������������������
    playerLeft(state, action: PayloadAction<string>) {
      state.players = state.players.filter((p) => p.id !== action.payload);
      delete state.allBets[action.payload];
      state.confirmedPlayers = state.confirmedPlayers.filter((id) => id !== action.payload);
    },

    // ���� Player reconnected ����������������������������������������������������������������������������������������������������
    playerReconnected(state, action: PayloadAction<string>) {
      const p = state.players.find((pl) => pl.id === action.payload);
      if (p) p.isConnected = true;
    },

    // ���� Player disconnected (temporary) ������������������������������������������������������������������������
    playerDisconnected(state, action: PayloadAction<string>) {
      const p = state.players.find((pl) => pl.id === action.payload);
      if (p) p.isConnected = false;
    },

    // ���� Bets updated ����������������������������������������������������������������������������������������������������������������
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

    // ���� Confirmed update ��������������������������������������������������������������������������������������������������������
    confirmedUpdate(
      state,
      action: PayloadAction<{ playerId: string; confirmedPlayers: string[] }>
    ) {
      state.confirmedPlayers = action.payload.confirmedPlayers;
      state.players = state.players.map((p) => ({
        ...p,
        isConfirmed: action.payload.confirmedPlayers.includes(p.id),
      }));
    },

    // ���� Rolling ��������������������������������������������������������������������������������������������������������������������������
    setRolling(state, action: PayloadAction<RoomState>) {
      state.isRolling = true;
      state.showResult = false;
      state.status = 'rolling';
      state.players = action.payload.players;
    },

    // ���� Dice result ������������������������������������������������������������������������������������������������������������������
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
      state.confirmedPlayers = [];
      state.allBets = {};
      state.myBets = emptyBets();

      state.lastResults = results;
      state.showResult = true;
    },

    // ���� Hide result ������������������������������������������������������������������������������������������������������������������
    hideResult(state) {
      state.showResult = false;
    },

    // ���� Leave room ��������������������������������������������������������������������������������������������������������������������
    leaveRoom(state) {
      state.screen = 'lobby';
      state.roomId = null;
      state.hostId = null;
      state.hostName = null;
      state.isHost = false;
      state.players = [];
      state.allBets = {};
      state.myBets = emptyBets();
      state.confirmedPlayers = [];
      state.history = [];
      state.isRolling = false;
      state.showResult = false;
      state.status = 'waiting';
      state.bankerDelta = null;
      localStorage.removeItem('bau-cua-last-room');
    },
  },
});

export const {
  setConnected,
  setReconnecting,
  setError,
  clearError,
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
  hideResult,
  leaveRoom,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
