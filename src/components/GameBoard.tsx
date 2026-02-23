import { BetTile } from './BetTile';
import { SYMBOLS } from '../constants/symbols';
import type { GameSymbol } from '../types/game';

interface GameBoardProps {
  bets: Record<GameSymbol, number>;
  winningSymbols: GameSymbol[];
  isRolling: boolean;
  onAddBet: (symbol: GameSymbol) => void;
  onRemoveBet: (symbol: GameSymbol) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  bets,
  winningSymbols,
  isRolling,
  onAddBet,
  onRemoveBet,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-600" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3">
          Đặt Cược
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-600" />
      </div>

      {/* Hint */}
      <p className="text-center text-[10px] text-gray-600 italic">
        Click trái +₫10 · Click phải −₫10
      </p>

      {/* 2-col mobile, 3-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {SYMBOLS.map((symbol) => (
          <BetTile
            key={symbol.id}
            symbol={symbol}
            betAmount={bets[symbol.id]}
            isWinning={winningSymbols.includes(symbol.id)}
            isRolling={isRolling}
            onAddBet={() => onAddBet(symbol.id)}
            onRemoveBet={() => onRemoveBet(symbol.id)}
          />
        ))}
      </div>
    </div>
  );
};
