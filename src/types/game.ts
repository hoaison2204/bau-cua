export type GameSymbol = 'bau' | 'cua' | 'tom' | 'ca' | 'nai' | 'ga';

export interface SymbolConfig {
  id: GameSymbol;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

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
