//  Shared types: server and client 

export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export const ALL_SYMBOLS: GameSymbol[] = ['bau', 'cua', 'tom', 'ca', 'nai', 'ga'];

export const INITIAL_PLAYER_BALANCE = 1000;
export const INITIAL_BANKER_BALANCE = 1_000_000;
export const BET_STEP = 10;
export const DICE_COUNT = 3;
export const ROLL_DURATION_MS = 2000;
export const MAX_HISTORY = 50;
export const MAX_PLAYERS = 10; // excluding host

//  Data structures 

export interface Player {
  id: string;
  name: string;
  balance: number;
  isConnected: boolean;
  isReady: boolean;
}

export interface RoundPlayerResult {
  playerId: string;
  playerName: string;
  bets: Record<GameSymbol, number>;
  winAmount: number;  // net profit (0 = lost all bets)
  totalBet: number;
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
  readyPlayers: string[];
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

//  Socket payloads: Client  Server 

export interface CreateRoomPayload {
  hostName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  playerId?: string; // reconnect
}

export interface PlaceBetPayload {
  symbol: GameSymbol;
}

export interface RemoveBetPayload {
  symbol: GameSymbol;
}

//  Socket payloads: Server  Client 

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

export interface ReadyUpdatePayload {
  playerId: string;
  readyPlayers: string[];
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
