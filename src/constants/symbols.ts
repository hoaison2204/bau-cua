import type { GameSymbol, SymbolConfig } from '../types/game';

export const SYMBOLS: SymbolConfig[] = [
  {
    id: 'bau',
    name: 'Bầu',
    emoji: '🍐',
    color: 'text-green-300',
    bgColor: 'bg-green-950',
    borderColor: 'border-green-700',
    glowColor: 'shadow-green-500',
  },
  {
    id: 'cua',
    name: 'Cua',
    emoji: '🦀',
    color: 'text-red-300',
    bgColor: 'bg-red-950',
    borderColor: 'border-red-700',
    glowColor: 'shadow-red-500',
  },
  {
    id: 'tom',
    name: 'Tôm',
    emoji: '🦐',
    color: 'text-orange-300',
    bgColor: 'bg-orange-950',
    borderColor: 'border-orange-700',
    glowColor: 'shadow-orange-500',
  },
  {
    id: 'ca',
    name: 'Cá',
    emoji: '🐟',
    color: 'text-blue-300',
    bgColor: 'bg-blue-950',
    borderColor: 'border-blue-700',
    glowColor: 'shadow-blue-500',
  },
  {
    id: 'nai',
    name: 'Nai',
    emoji: '🦌',
    color: 'text-amber-300',
    bgColor: 'bg-amber-950',
    borderColor: 'border-amber-700',
    glowColor: 'shadow-amber-500',
  },
  {
    id: 'ga',
    name: 'Gà',
    emoji: '🐓',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-950',
    borderColor: 'border-yellow-700',
    glowColor: 'shadow-yellow-500',
  },
];

export const SYMBOL_MAP: Record<GameSymbol, SymbolConfig> = SYMBOLS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s }),
  {} as Record<GameSymbol, SymbolConfig>
);

export const ALL_SYMBOLS: GameSymbol[] = SYMBOLS.map((s) => s.id);

export const INITIAL_BALANCE = 1000;
export const BET_STEP = 10;
export const MIN_BET = 0;
export const DICE_COUNT = 3;
export const ROLL_DURATION_MS = 1500;
export const RESULT_DISPLAY_DURATION_MS = 2500;
export const STORAGE_KEY = 'bau-cua-balance';
