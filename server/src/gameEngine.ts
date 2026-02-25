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


// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

const rollDice = (): GameSymbol[] =>
  Array.from({ length: DICE_COUNT }, randomSymbol);

const emptyBets = (): Record<GameSymbol, number> =>
  ALL_SYMBOLS.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<GameSymbol, number>);

// \u2500\u2500 GameRoom \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

export class GameRoom {
  public readonly id: string;
  private _hostId: string;
  private _hostName: string;
  private _hostSocketId: string = '';
  private _hostIsConnected: boolean = true;

  private players = new Map<string, Player>();
  private bets = new Map<string, Record<GameSymbol, number>>();
  private confirmedPlayers = new Set<string>();
  private _bankerBalance: number;
  private dice: GameSymbol[] = [randomSymbol(), randomSymbol(), randomSymbol()];
  private history: RoundHistory[] = [];
  private currentRound = 0;
  private status: RoomStatus = 'waiting';

  constructor(id: string, hostId: string, hostName: string, bankerBalance?: number) {
    this.id = id;
    this._hostId = hostId;
    this._hostName = hostName;
    this._bankerBalance = bankerBalance ?? INITIAL_BANKER_BALANCE;
  }

  // \u2500\u2500 Getters \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  get hostId(): string { return this._hostId; }
  get hostName(): string { return this._hostName; }
  get hostSocketId(): string { return this._hostSocketId; }
  get hostIsConnected(): boolean { return this._hostIsConnected; }
  get bankerBalance(): number { return this._bankerBalance; }

  // \u2500\u2500 Host management \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  setHostSocketId(socketId: string): void {
    this._hostSocketId = socketId;
    this._hostIsConnected = true;
  }

  disconnectHost(): void {
    this._hostIsConnected = false;
  }

  setBankerBalance(amount: number): void {
    if (amount > 0) this._bankerBalance = amount;
  }

  /** Transfer host to the first connected player. Returns new host info or null if no players. */
  transferHost(): { newHostId: string; newHostName: string } | null {
    for (const player of this.players.values()) {
      if (player.isConnected) {
        this._hostId = player.id;
        this._hostName = player.name;
        this._hostIsConnected = true;
        // Remove them from the players list (host is not a player)
        this.players.delete(player.id);
        this.bets.delete(player.id);
        this.confirmedPlayers.delete(player.id);
        return { newHostId: player.id, newHostName: player.name };
      }
    }
    return null;
  }

  // \u2500\u2500 Capacity \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  isFull(): boolean {
    return this.players.size >= MAX_PLAYERS;
  }

  isHost(playerId: string): boolean {
    return playerId === this._hostId;
  }

  // \u2500\u2500 Player management \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  addPlayer(
    id: string,
    name: string,
    socketId: string,
    startingBalance?: number,
  ): { ok: boolean; player?: Player; error?: string } {
    const existing = this.players.get(id);
    if (existing) {
      // Reconnect existing player
      existing.isConnected = true;
      existing.socketId = socketId;
      return { ok: true, player: existing };
    }
    if (this.isFull()) {
      return { ok: false, error: 'room_full' };
    }
    const player: Player = {
      id,
      name,
      balance: Math.max(0, startingBalance ?? INITIAL_PLAYER_BALANCE),
      socketId,
      isConnected: true,
      isConfirmed: false,
    };
    this.players.set(id, player);
    this.bets.set(id, emptyBets());
    if (this.status === 'waiting') this.status = 'betting';
    return { ok: true, player };
  }

  reconnectPlayer(playerId: string, socketId: string): void {
    const p = this.players.get(playerId);
    if (p) {
      p.isConnected = true;
      p.socketId = socketId;
    }
  }

  disconnectPlayer(id: string): void {
    const p = this.players.get(id);
    if (p) p.isConnected = false;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
    this.bets.delete(id);
    this.confirmedPlayers.delete(id);
    if (this.players.size === 0) this.status = 'waiting';
  }

  setBalance(playerId: string, amount: number): { ok: boolean; error?: string } {
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (amount < 0) return { ok: false, error: 'Balance must be >= 0' };
    player.balance = amount;
    return { ok: true };
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  get playerCount(): number {
    return this.players.size;
  }

  // \u2500\u2500 Betting \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  setBet(playerId: string, symbol: GameSymbol, amount: number): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot bet' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };
    if (this.confirmedPlayers.has(playerId)) return { ok: false, error: 'Already confirmed' };
    if (!Number.isFinite(amount) || amount < 0) return { ok: false, error: 'Invalid amount' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    const otherBetsTotal = ALL_SYMBOLS
      .filter((s) => s !== symbol)
      .reduce((sum, s) => sum + (bets[s] ?? 0), 0);

    if (otherBetsTotal + amount > player.balance) {
      return { ok: false, error: 'Insufficient balance' };
    }

    bets[symbol] = amount;
    this.bets.set(playerId, bets);
    return { ok: true };
  }

  resetBets(playerId: string): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot bet' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    if (this.confirmedPlayers.has(playerId)) return { ok: false, error: 'Already confirmed' };
    this.bets.set(playerId, emptyBets());
    return { ok: true };
  }

  getBetsForPlayer(playerId: string): Record<GameSymbol, number> {
    return this.bets.get(playerId) ?? emptyBets();
  }

  // \u2500\u2500 Confirm system (\u0110\u1eb7t / H\u1ee7y \u0110\u1eb7t) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  confirmBet(playerId: string): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot confirm' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (!player) return { ok: false, error: 'Player not found' };

    const bets = this.bets.get(playerId) ?? emptyBets();
    const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return { ok: false, error: 'Place a bet before confirming' };
    if (totalBet > player.balance) return { ok: false, error: 'Insufficient balance' };

    player.isConfirmed = true;
    this.confirmedPlayers.add(playerId);
    return { ok: true };
  }

  unconfirmBet(playerId: string): { ok: boolean; error?: string } {
    if (this.isHost(playerId)) return { ok: false, error: 'Host cannot confirm' };
    if (this.status !== 'betting') return { ok: false, error: 'Not in betting phase' };
    const player = this.players.get(playerId);
    if (player) player.isConfirmed = false;
    this.confirmedPlayers.delete(playerId);
    return { ok: true };
  }

  getConfirmedPlayers(): string[] {
    return Array.from(this.confirmedPlayers);
  }

  // \u2500\u2500 Roll \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  startRoll(requesterId: string): { ok: boolean; error?: string } {
    if (!this.isHost(requesterId)) return { ok: false, error: 'Only host can roll' };
    if (this.status !== 'betting') return { ok: false, error: 'Already rolling' };
    if (this.confirmedPlayers.size === 0) return { ok: false, error: 'No players confirmed' };

    // Deduct bets from confirmed players only
    for (const playerId of this.confirmedPlayers) {
      const player = this.players.get(playerId);
      const bets = this.bets.get(playerId);
      if (!player || !bets) continue;
      const total = Object.values(bets).reduce((a, b) => a + b, 0);
      if (total > 0) {
        player.balance -= total;
        this._bankerBalance += total;
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
    let totalCollected = 0;

    for (const playerId of this.confirmedPlayers) {
      const player = this.players.get(playerId);
      const bets = this.bets.get(playerId);
      if (!player || !bets) continue;

      const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);
      if (totalBet === 0) continue;

      totalCollected += totalBet;

      let winAmount = 0;
      let totalReturn = 0;

      for (const symbol of ALL_SYMBOLS) {
        const bet = bets[symbol];
        if (bet <= 0) continue;
        const matchCount = this.dice.filter((d) => d === symbol).length;
        if (matchCount > 0) {
          const gross = bet * matchCount;
          winAmount += gross;
          totalReturn += gross + bet;
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
        profit: totalReturn - totalBet,
      });
    }

    this._bankerBalance -= bankerPayout;

    const historyEntry: RoundHistory = {
      id: uuidv4(),
      roundNumber: this.currentRound,
      dice: [...this.dice],
      results,
      bankerDelta: totalCollected - bankerPayout,
      bankerBalance: this._bankerBalance,
      timestamp: Date.now(),
    };

    this.history.unshift(historyEntry);
    if (this.history.length > MAX_HISTORY) this.history.length = MAX_HISTORY;

    // Reset confirmed + bets
    for (const player of this.players.values()) {
      player.isConfirmed = false;
    }
    this.confirmedPlayers.clear();
    for (const playerId of this.bets.keys()) {
      this.bets.set(playerId, emptyBets());
    }

    this.status = 'betting';

    return {
      dice: this.dice,
      results,
      history: historyEntry,
      bankerBalance: this._bankerBalance,
      updatedPlayers: Array.from(this.players.values()),
    };
  }

  // \u2500\u2500 Summary & state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  getSummary(): RoomSummary {
    return {
      id: this.id,
      hostName: this._hostName,
      playerCount: this.players.size,
      maxPlayers: MAX_PLAYERS,
      status: this.status,
    };
  }

  getState(): RoomState {
    return {
      id: this.id,
      hostId: this._hostId,
      hostName: this._hostName,
      status: this.status,
      bankerBalance: this._bankerBalance,
      players: Array.from(this.players.values()),
      bets: Object.fromEntries(
        Array.from(this.bets.entries()).map(([pid, b]) => [pid, { ...b }])
      ),
      confirmedPlayers: Array.from(this.confirmedPlayers),
      dice: [...this.dice],
      history: this.history.slice(0, MAX_HISTORY),
      currentRound: this.currentRound,
    };
  }
}

// \u2500\u2500 Room registry \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const rooms = new Map<string, GameRoom>();

const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(id) ? generateRoomId() : id;
};

export const createRoom = (
  hostId: string,
  hostName: string,
  bankerBalance?: number,
): GameRoom => {
  const id = generateRoomId();
  const room = new GameRoom(id, hostId, hostName, bankerBalance);
  rooms.set(id, room);
  return room;
};

export const getRoom = (id: string): GameRoom | undefined => rooms.get(id);

export const deleteRoom = (id: string): void => {
  rooms.delete(id);
};

export const getAllRooms = (): GameRoom[] => Array.from(rooms.values());

/** Find which room a player (by playerId) is currently in */
export const getRoomByPlayerId = (playerId: string): GameRoom | undefined => {
  for (const room of rooms.values()) {
    if (room.hostId === playerId) return room;
    if (room.getPlayer(playerId)) return room;
  }
  return undefined;
};
