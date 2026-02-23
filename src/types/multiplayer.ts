// ─── Shared types (mirrors server/src/types.ts) ───────────────────────────────

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export interface Player {
  id: string;
  name: string;
  balance: number;
  isConnected: boolean;
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  bets: Record<GameSymbol, number>;
  winAmount: number;
  totalBet: number;
}

export interface RoundHistory {
  id: string;
  roundNumber: number;
  dice: GameSymbol[];
  results: RoundResult[];
  bankerDelta: number;
  bankerBalance: number;
  timestamp: number;
}

export type RoomPhase = 'betting' | 'rolling' | 'result';

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  players: Player[];
  bets: Record<string, Record<GameSymbol, number>>;
  bankerBalance: number;
  dice: GameSymbol[];
  history: RoundHistory[];
  currentRound: number;
}

// ─── Redux multiplayer state ──────────────────────────────────────────────────

export interface MultiplayerState {
  // Self
  playerId: string | null;
  playerName: string | null;
  hasJoined: boolean;

  // Room
  phase: RoomPhase;
  players: Player[];
  allBets: Record<string, Record<GameSymbol, number>>; // all players' bets
  myBets: Record<GameSymbol, number>;
  bankerBalance: number;
  bankerDelta: number | null; // last round delta

  // Dice
  dice: GameSymbol[];
  isRolling: boolean;

  // History
  history: RoundHistory[];
  currentRound: number;

  // Last round
  lastResults: RoundResult[];
  showResult: boolean;

  // Connection
  connected: boolean;
  error: string | null;
}

// ─── Legacy single player state (kept for BetTile / Die components) ───────────

export interface GameState {
  balance: number;
  bets: Record<GameSymbol, number>;
  dice: GameSymbol[];
  isRolling: boolean;
  lastResult: 'win' | 'lose' | null;
  winAmount: number;
  totalBet: number;
  showResult: boolean;
  previousBalance: number;
}
