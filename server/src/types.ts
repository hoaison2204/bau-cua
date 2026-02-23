// ─── Shared types between server and client ──────────────────────────────────

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export const ALL_SYMBOLS: GameSymbol[] = ['bau', 'cua', 'tom', 'ca', 'nai', 'ga'];

export const INITIAL_PLAYER_BALANCE = 1000;
export const INITIAL_BANKER_BALANCE = 1_000_000;
export const BET_STEP = 10;
export const DICE_COUNT = 3;
export const ROLL_DURATION_MS = 2000; // ms of rolling animation
export const MAX_HISTORY = 50;
export const DEFAULT_ROOM = 'main';

// ─── Data structures ──────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  balance: number;
  isConnected: boolean;
}

export interface Banker {
  balance: number;
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  bets: Record<GameSymbol, number>;
  winAmount: number; // net profit (0 = lost all bets)
  totalBet: number;
}

export interface RoundHistory {
  id: string;
  roundNumber: number;
  dice: GameSymbol[];
  results: RoundResult[];
  bankerDelta: number; // positive = banker gained, negative = banker paid out
  bankerBalance: number; // snapshot after round
  timestamp: number;
}

export type RoomPhase = 'betting' | 'rolling' | 'result';

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  players: Player[];
  bets: Record<string, Record<GameSymbol, number>>; // playerId → symbol → amount
  bankerBalance: number;
  dice: GameSymbol[];
  history: RoundHistory[];
  currentRound: number;
}

// ─── Socket event payloads ─────────────────────────────────────────────────────

// Client → Server
export interface JoinGamePayload {
  playerName: string;
  playerId?: string; // reconnect with same ID
}

export interface PlaceBetPayload {
  symbol: GameSymbol;
}

export interface RemoveBetPayload {
  symbol: GameSymbol;
}

// Server → Client
export interface GameStatePayload {
  roomState: RoomState;
  yourPlayerId: string;
}

export interface DiceResultPayload {
  dice: GameSymbol[];
  results: RoundResult[];
  history: RoundHistory;
  bankerBalance: number;
  updatedPlayers: Player[];
}

export interface PlayerJoinedPayload {
  player: Player;
}

export interface PlayerLeftPayload {
  playerId: string;
}

export interface BetsUpdatedPayload {
  playerId: string;
  bets: Record<GameSymbol, number>;
}

export interface ErrorPayload {
  message: string;
}
