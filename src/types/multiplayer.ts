// ── Shared types (mirrors server/src/types.ts) ───────────────────────────

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export const ALL_SYMBOLS: GameSymbol[] = ['bau', 'cua', 'tom', 'ca', 'nai', 'ga'];

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
  winAmount: number;
  totalBet: number;
  profit: number;   // net profit = totalReturn - totalBet (negative = lost)
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

// ── Redux state ──────────────────────────────────────────────────────────────────────────

export type AppScreen = 'lobby' | 'room';

export interface MultiplayerState {
  screen: AppScreen;

  // Connection
  connected: boolean;
  error: string | null;
  isReconnecting: boolean;

  // Self
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;

  // Room
  roomId: string | null;
  hostId: string | null;
  hostName: string | null;
  status: RoomStatus;
  bankerBalance: number;
  bankerDelta: number | null;
  players: Player[];
  allBets: Record<string, Record<GameSymbol, number>>;
  myBets: Record<GameSymbol, number>;
  confirmedPlayers: string[];
  dice: GameSymbol[];
  history: RoundHistory[];
  currentRound: number;
  isRolling: boolean;

  // Result
  lastResults: RoundPlayerResult[];
  showResult: boolean;

  // Lobby
  rooms: RoomSummary[];
}
