import { v4 as uuidv4 } from 'uuid';
import {
  ALL_SYMBOLS,
  DICE_COUNT,
  INITIAL_BANKER_BALANCE,
  INITIAL_PLAYER_BALANCE,
  MAX_HISTORY,
  MAX_PLAYERS,
} from './types';
import type {
  GameSymbol,
  Player,
  RoomState,
  RoomStatus,
  RoomSummary,
  RoundHistory,
  RoundPlayerResult,
} from './types';

//  Helpers 

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const rollDice = (): GameSymbol[] =>
  Array.from({ length: DICE_COUNT }, randomSymbol);

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<GameSymbol, number>);

//  GameRoom 

export class GameRoom {
  public readonly id: string;
  public readonly hostId: string;
  public readonly hostName: string;

  private players = new Map<string, Player>();
  private bets = new Map<string, Record<GameSymbol, number>>();
  private readyPlayers = new Set<string>();
  private bankerBalance = INITIAL_BANKER_BALANCE;
  private dice: GameSymbol[] = [randomSymbol(), randomSymbol(), randomSymbol()];
  private history: RoundHistory[] = [];
  private currentRound = 0;
  private status: RoomStatus = 'waiting';

  constructor(id: string, hostId: string, hostName: string) {
    this.id = id;
    this.hostId = hostId;
    this.hostName = hostName;
  }

  //  Capacity 

  isFull(): boolean {
    return this.players.size >= MAX_PLAYERS;
  }

  isHost(playerId: string): boolean {
    return playerId === this.hostId;
  }

  //  Player management 

  addPlayer(id: string, name: string): { ok: boolean; player?: Player; error?: string } {
    if (this.isHost(id)) {
      // Host re-joined (reconnect)
      return { ok: true };
    }
    const existing = this.players.get(id);
    if (existing) {
      existing.isConnected = true;
      return { ok: true, player: existing };
    }
    if (this.isFull()) {
      return { ok: false, error: 'room_full' };
    }
    const player: Player = {
      id,
      name,
      balance: INITIAL_PLAYER_BALANCE,
      isConnected: true,
      isReady: false,
    };
    this.players.set(id, player);
    this.bets.set(id, emptyBets());
    this.status = 'betting';
    return { ok: true, player };
  }

  disconnectPlayer(id: string): void {
    if (this.isHost(id)) return; // host disconnect handled elsewhere
    const p = this.players.get(id);
    if (p) p.isConnected = false;
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  get playerCount(): number {
    return this.players.size;
  }

  //  Betting 

  placeBet(playerId: string, symbol: GameSymbol): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot bet' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (player.isReady) return { ok: false, error: 'Already ready, cannot change bet' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    const spent = Object.values(bets).reduce((a, b) => a + b, 0);
    if (player.balance - spent < 10) return { ok: false, error: 'Insufficient balance' };

    bets[symbol] += 10;
    this.bets.set(playerId, bets);
    return { ok: true };
  }

  removeBet(playerId: string, symbol: GameSymbol): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot bet' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (player.isReady) return { ok: false, error: 'Already ready, cannot change bet' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    if (bets[symbol] < 10) return { ok: false, error: 'No bet to remove' };
    bets[symbol] -= 10;
    this.bets.set(playerId, bets);
    return { ok: true };
  }

  resetBets(playerId: string): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot bet' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (player.isReady) return { ok: false, error: 'Already ready, cannot change bet' };

    this.bets.set(playerId, emptyBets());
    return { ok: true };
  }

  getBetsForPlayer(playerId: string): Record<GameSymbol, number> {
    return this.bets.get(playerId) ?? emptyBets();
  }

  //  Ready system 

  setReady(playerId: string): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot ready' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return { ok: false, error: 'Place a bet before readying' };

    player.isReady = true;
    this.readyPlayers.add(playerId);
    return { ok: true };
  }

  unsetReady(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) player.isReady = false;
    this.readyPlayers.delete(playerId);
  }

  getReadyPlayers(): string[] {
    return Array.from(this.readyPlayers);
  }

  //  Roll 

  startRoll(requesterId: string): { ok: boolean; error?: string } {
    if (!this.isHost(requesterId)) return { ok: false, error: 'Only host can roll' };
    if (this.status !== 'betting') return { ok: false, error: 'Already rolling' };
    if (this.readyPlayers.size === 0) return { ok: false, error: 'No players ready' };

    // Deduct bets from READY players only; refund others
    for (const [playerId, bets] of this.bets.entries()) {
      const player = this.players.get(playerId);
      if (!player) continue;
      const total = Object.values(bets).reduce((a, b) => a + b, 0);
      if (total === 0) continue;

      if (this.readyPlayers.has(playerId)) {
        player.balance -= total;
        this.bankerBalance += total;
      } else {
        // Not ready  bets are discarded (refund already in balance since we only deduct here)
        this.bets.set(playerId, emptyBets());
      }
    }

    this.status = 'rolling';
    return { ok: true };
  }

  finishRoll(): {
    dice: GameSymbol[];
    results: RoundPlayerResult[];
    history: RoundHistory;
    bankerBalance: number;
    updatedPlayers: Player[];
  } {
    this.dice = rollDice();
    this.currentRound += 1;

    const results: RoundPlayerResult[] = [];
    let bankerPayout = 0;

    for (const playerId of this.readyPlayers) {
      const player = this.players.get(playerId);
      const bets = this.bets.get(playerId);
      if (!player || !bets) continue;

      const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
      if (totalBet === 0) continue;

      let winAmount = 0;
      let totalReturn = 0;

      for (const symbol of ALL_SYMBOLS) {
        const bet = bets[symbol];
        if (bet <= 0) continue;
        const matchCount = this.dice.filter((d) => d === symbol).length;
        if (matchCount > 0) {
          const profit = bet * matchCount;
          winAmount += profit;
          totalReturn += profit + bet;
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

    const historyEntry: RoundHistory = {
      id: uuidv4(),
      roundNumber: this.currentRound,
      dice: [...this.dice],
      results,
      bankerDelta: 0 - bankerPayout + this.getTotalBetByReadyPlayers(),
      bankerBalance: this.bankerBalance,
      timestamp: Date.now(),
    };

    this.history.unshift(historyEntry);
    if (this.history.length > MAX_HISTORY) this.history.length = MAX_HISTORY;

    // Reset ready + bets
    for (const player of this.players.values()) {
      player.isReady = false;
    }
    this.readyPlayers.clear();
    for (const playerId of this.bets.keys()) {
      this.bets.set(playerId, emptyBets());
    }

    this.status = 'betting';

    return {
      dice: this.dice,
      results,
      history: historyEntry,
      bankerBalance: this.bankerBalance,
      updatedPlayers: Array.from(this.players.values()),
    };
  }

  private getTotalBetByReadyPlayers(): number {
    let total = 0;
    for (const playerId of this.readyPlayers) {
      const bets = this.bets.get(playerId);
      if (bets) total += Object.values(bets).reduce((a, b) => a + b, 0);
    }
    return total;
  }

  //  Summary & state 

  getSummary(): RoomSummary {
    return {
      id: this.id,
      hostName: this.hostName,
      playerCount: this.players.size,
      maxPlayers: MAX_PLAYERS,
      status: this.status,
    };
  }

  getState(): RoomState {
    return {
      id: this.id,
      hostId: this.hostId,
      hostName: this.hostName,
      status: this.status,
      bankerBalance: this.bankerBalance,
      players: Array.from(this.players.values()),
      bets: Object.fromEntries(
        Array.from(this.bets.entries()).map(([pid, b]) => [pid, { ...b }])
      ),
      readyPlayers: Array.from(this.readyPlayers),
      dice: [...this.dice],
      history: this.history.slice(0, MAX_HISTORY),
      currentRound: this.currentRound,
    };
  }
}

//  Room registry 

const rooms = new Map<string, GameRoom>();

const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
};

export const createRoom = (hostId: string, hostName: string): GameRoom => {
  const id = generateRoomId();
  const room = new GameRoom(id, hostId, hostName);
  rooms.set(id, room);
  return room;
};

export const getRoom = (id: string): GameRoom | undefined => rooms.get(id);

export const deleteRoom = (id: string): void => {
  rooms.delete(id);
};

export const getAllRooms = (): GameRoom[] => Array.from(rooms.values());
