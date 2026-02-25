// Mirror of server-side socket event payloads
import type { Player, RoomState, RoundHistory, RoundPlayerResult, GameSymbol } from './multiplayer';

export interface GameStatePayload {
  roomState: RoomState;
  yourPlayerId: string;
}

export interface DiceResultPayload {
  dice: GameSymbol[];
  results: RoundPlayerResult[];
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
