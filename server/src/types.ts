// ── Shared types: server and client ─────────────────────────────────────────

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export const ALL_SYMBOLS: GameSymbol[] = ['bau', 'cua', 'tom', 'ca', 'nai', 'ga'];

export const INITIAL_PLAYER_BALANCE = 1_000;
export const INITIAL_BANKER_BALANCE = 10_000_000;
export const BET_STEP = 100;
export const DICE_COUNT = 3;
export const ROLL_DURATION_MS = 2500;
export const MAX_HISTORY = 50;
export const MAX_PLAYERS = 10;          // excluding host
export const DISCONNECT_TIMEOUT_MS = 45_000; // 45 seconds

// ── Data structures ──────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  balance: number;
  socketId: string;
  isConnected: boolean;
  isConfirmed: boolean;
}

export interface RoundPlayerResult {
  playerId: string;
  playerName: string;
  bets: Record<GameSymbol, number>;
  winAmount: number;  // gross winnings (not counting stake recovery)
  totalBet: number;
  profit: number;     // net profit = totalReturn - totalBet (can be negative)
}

export interface RoundHistory {
  id: string;
  roundNumber: number;
  dice: GameSymbol[];
  results: RoundPlayerResult[];
  bankerDelta: number;
  bankerBalance: number;
  timestamp: number;
}

export type RoomStatus = 'waiting' | 'betting' | 'rolling';

export interface RoomState {
  id: string;
  hostId: string;
  hostName: string;
  status: RoomStatus;
  bankerBalance: number;
  players: Player[];
  bets: Record<string, Record<GameSymbol, number>>;
  confirmedPlayers: string[];
  dice: GameSymbol[];
  history: RoundHistory[];
  currentRound: number;
}

export interface RoomSummary {
  id: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

// ── Socket payloads: Client → Server ─────────────────────────────────────────

export interface CreateRoomPayload {
  hostName: string;
  bankerBalance?: number;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  playerId?: string;
  startingBalance?: number;
}

export interface ReconnectPlayerPayload {
  playerId: string;
  roomId: string;
}

export interface SetBalancePayload {
  amount: number;
}

export interface SetBetPayload {
  symbol: GameSymbol;
  amount: number;
}

// ── Socket payloads: Server → Client ─────────────────────────────────────────

export interface RoomJoinedPayload {
  roomState: RoomState;
  yourPlayerId: string;
  isHost: boolean;
}

export interface RoomListPayload {
  rooms: RoomSummary[];
}

export interface BetsUpdatedPayload {
  playerId: string;
  bets: Record<GameSymbol, number>;
}

export interface ConfirmUpdatePayload {
  playerId: string;
  confirmedPlayers: string[];
}

export interface HostChangedPayload {
  newHostId: string;
  newHostName: string;
}

export interface DiceResultPayload {
  dice: GameSymbol[];
  results: RoundPlayerResult[];
  history: RoundHistory;
  bankerBalance: number;
  updatedPlayers: Player[];
}

export interface ErrorPayload {
  code: string;
  message: string;
}
