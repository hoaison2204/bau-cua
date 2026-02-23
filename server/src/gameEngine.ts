import { v4 as uuidv4 } from 'uuid';
import {
  ALL_SYMBOLS,
  DICE_COUNT,
  INITIAL_BANKER_BALANCE,
  INITIAL_PLAYER_BALANCE,
  MAX_HISTORY,
} from './types';
import type {
  GameSymbol,
  Player,
  RoomState,
  RoundHistory,
  RoundResult,
} from './types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const rollDice = (): GameSymbol[] =>
  Array.from({ length: DICE_COUNT }, () => randomSymbol());

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<GameSymbol, number>);

// ─── Room engine ──────────────────────────────────────────────────────────────

export class GameRoom {
  public roomId: string;
  private players: Map<string, Player> = new Map();
  private bets: Map<string, Record<GameSymbol, number>> = new Map();
  private bankerBalance: number = INITIAL_BANKER_BALANCE;
  private dice: GameSymbol[] = [randomSymbol(), randomSymbol(), randomSymbol()];
  private history: RoundHistory[] = [];
  private currentRound: number = 0;
  private phase: RoomState['phase'] = 'betting';

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  // ── Player management ──────────────────────────────────────────────────────

  addPlayer(id: string, name: string): Player {
    const existing = this.players.get(id);
    if (existing) {
      existing.isConnected = true;
      return existing;
    }
    const player: Player = {
      id,
      name,
      balance: INITIAL_PLAYER_BALANCE,
      isConnected: true,
    };
    this.players.set(id, player);
    this.bets.set(id, emptyBets());
    return player;
  }

  disconnectPlayer(id: string): void {
    const p = this.players.get(id);
    if (p) p.isConnected = false;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.bets.delete(id);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  // ── Betting ────────────────────────────────────────────────────────────────

  placeBet(playerId: string, symbol: GameSymbol): { ok: boolean; error?: string } {
    if (this.phase !== 'betting') return { ok: false, error: 'Not in betting phase' };

    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

    if (player.balance - totalBet < 10) return { ok: false, error: 'Insufficient balance' };

    bets[symbol] += 10;
    this.bets.set(playerId, bets);
    return { ok: true };
  }

  removeBet(playerId: string, symbol: GameSymbol): { ok: boolean; error?: string } {
    if (this.phase !== 'betting') return { ok: false, error: 'Not in betting phase' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    if (bets[symbol] < 10) return { ok: false, error: 'No bet to remove' };

    bets[symbol] -= 10;
    this.bets.set(playerId, bets);
    return { ok: true };
  }

  resetBets(playerId: string): void {
    if (this.phase === 'betting') {
      this.bets.set(playerId, emptyBets());
    }
  }

  // ── Rolling ────────────────────────────────────────────────────────────────

  /** Start a roll: deduct all bets, set phase to rolling */
  startRoll(): { ok: boolean; error?: string } {
    if (this.phase !== 'betting') return { ok: false, error: 'Already rolling' };

    // Deduct bets from player balances
    for (const [playerId, bets] of this.bets.entries()) {
      const player = this.players.get(playerId);
      if (!player) continue;
      const total = Object.values(bets).reduce((a, b) => a + b, 0);
      player.balance -= total;
      this.bankerBalance += total;
    }

    this.phase = 'rolling';
    return { ok: true };
  }

  /** Finish roll: roll dice, calculate results, update balances */
  finishRoll(): {
    dice: GameSymbol[];
    results: RoundResult[];
    history: RoundHistory;
    bankerBalance: number;
    updatedPlayers: Player[];
  } {
    this.dice = rollDice();
    this.currentRound += 1;

    const results: RoundResult[] = [];
    let bankerPayout = 0;

    for (const [playerId, bets] of this.bets.entries()) {
      const player = this.players.get(playerId);
      if (!player) continue;

      const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
      if (totalBet === 0) continue;

      // Calculate winnings
      let winAmount = 0;
      let totalReturn = 0;
      for (const symbol of ALL_SYMBOLS) {
        const bet = bets[symbol];
        if (bet <= 0) continue;
        const matchCount = this.dice.filter((d) => d === symbol).length;
        if (matchCount > 0) {
          const profit = bet * matchCount;
          winAmount += profit;
          totalReturn += profit + bet; // profit + original bet refund
        }
      }

      player.balance += totalReturn;
      bankerPayout += totalReturn;

      results.push({
        playerId,
        playerName: player.name,
        bets: { ...bets },
        winAmount,
        totalBet,
      });
    }

    this.bankerBalance -= bankerPayout;
    const bankerDelta = this.getBetTotal() - bankerPayout;

    const historyEntry: RoundHistory = {
      id: uuidv4(),
      roundNumber: this.currentRound,
      dice: [...this.dice],
      results,
      bankerDelta,
      bankerBalance: this.bankerBalance,
      timestamp: Date.now(),
    };

    this.history.unshift(historyEntry);
    if (this.history.length > MAX_HISTORY) this.history.length = MAX_HISTORY;

    // Reset bets after round
    for (const playerId of this.bets.keys()) {
      this.bets.set(playerId, emptyBets());
    }

    this.phase = 'betting';

    return {
      dice: this.dice,
      results,
      history: historyEntry,
      bankerBalance: this.bankerBalance,
      updatedPlayers: Array.from(this.players.values()),
    };
  }

  // ── State snapshot ─────────────────────────────────────────────────────────

  getState(): RoomState {
    return {
      roomId: this.roomId,
      phase: this.phase,
      players: Array.from(this.players.values()),
      bets: Object.fromEntries(
        Array.from(this.bets.entries()).map(([pid, b]) => [pid, { ...b }])
      ),
      bankerBalance: this.bankerBalance,
      dice: [...this.dice],
      history: this.history.slice(0, MAX_HISTORY),
      currentRound: this.currentRound,
    };
  }

  getBetsForPlayer(playerId: string): Record<GameSymbol, number> {
    return this.bets.get(playerId) ?? emptyBets();
  }

  private getBetTotal(): number {
    let total = 0;
    for (const bets of this.bets.values()) {
      total += Object.values(bets).reduce((a, b) => a + b, 0);
    }
    return total;
  }
}

// ─── Room registry ─────────────────────────────────────────────────────────

const rooms = new Map<string, GameRoom>();

export const getOrCreateRoom = (roomId: string): GameRoom => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new GameRoom(roomId));
  }
  return rooms.get(roomId)!;
};
