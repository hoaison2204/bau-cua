import React from 'react';
import { BetTile } from './BetTile';
import { SYMBOLS } from '../constants/symbols';
import type { GameSymbol } from '../types/multiplayer';

interface GameBoardProps {
  bets: Record<string, number>;
  winningSymbols: string[];
  isRolling: boolean;
  disabled?: boolean;
  isConfirmed?: boolean;
  playerBalance: number;
  onSetBet: (symbol: GameSymbol, amount: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  bets,
  winningSymbols,
  isRolling,
  disabled = false,
  isConfirmed = false,
  playerBalance,
  onSetBet,
}) => {
  const totalBetAllSymbols = Object.values(bets).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-600" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3">
          Dat Cuoc
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {SYMBOLS.map((symbol) => {
          const betOnThis = bets[symbol.id] ?? 0;
          const otherBetsTotal = totalBetAllSymbols - betOnThis;
          return (
            <BetTile
              key={symbol.id}
              symbol={symbol}
              betAmount={betOnThis}
              playerBalance={playerBalance}
              otherBetsTotal={otherBetsTotal}
              isWinning={winningSymbols.includes(symbol.id)}
              isRolling={isRolling || disabled}
              isConfirmed={isConfirmed}
              onSetBet={(amount) => onSetBet(symbol.id as GameSymbol, amount)}
            />
          );
        })}
      </div>
    </div>
  );
};