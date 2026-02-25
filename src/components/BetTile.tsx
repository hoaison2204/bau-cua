import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SymbolConfig } from '../types/game';

const BET_STEP = 100;

interface BetTileProps {
  symbol: SymbolConfig;
  betAmount: number;
  playerBalance: number;
  otherBetsTotal: number;  // sum of bets on OTHER symbols
  isWinning: boolean;
  isRolling: boolean;
  isConfirmed: boolean;
  onSetBet: (amount: number) => void;
}

export const BetTile: React.FC<BetTileProps> = ({
  symbol,
  betAmount,
  playerBalance,
  otherBetsTotal,
  isWinning,
  isRolling,
  isConfirmed,
  onSetBet,
}) => {
  const disabled = isRolling || isConfirmed;
  const hasBet = betAmount > 0;
  const maxBet = Math.max(0, playerBalance - otherBetsTotal);

  // Local input state for typed value
  const [inputVal, setInputVal] = useState<string>(String(betAmount));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when bet changes externally
  useEffect(() => {
    setInputVal(String(betAmount));
  }, [betAmount]);

  const applyBet = (raw: number) => {
    const clamped = Math.max(0, Math.min(raw, maxBet));
    onSetBet(clamped);
    setInputVal(String(clamped));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setInputVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyBet(parseInt(val || '0', 10));
    }, 400);
  };

  const handleInputBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    applyBet(parseInt(inputVal || '0', 10));
  };

  const handleDecrease = () => {
    if (disabled) return;
    applyBet(betAmount - BET_STEP);
  };

  const handleIncrease = () => {
    if (disabled) return;
    applyBet(betAmount + BET_STEP);
  };

  return (
    <motion.div
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl border-2 select-none
        p-3 sm:p-4 gap-2
        transition-all duration-200
        ${disabled ? 'opacity-70' : ''}
        ${hasBet
          ? `${symbol.borderColor} ${symbol.bgColor} shadow-lg ${isWinning ? 'ring-2 ring-yellow-400' : ''}`
          : 'border-gray-700 bg-gray-900/60'
        }
        ${isWinning ? `shadow-[0_0_24px_4px] ${symbol.glowColor} animate-pulse` : ''}
      `}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      animate={
        isWinning
          ? { scale: [1, 1.06, 1, 1.04, 1], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 } }
          : { scale: 1 }
      }
    >
      {/* Winning glow overlay */}
      {isWinning && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-yellow-400/10"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Emoji */}
      <motion.span
        className="text-3xl sm:text-4xl leading-none"
        animate={isWinning ? { rotate: [0, -10, 10, -5, 5, 0] } : {}}
        transition={isWinning ? { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 } : {}}
      >
        {symbol.emoji}
      </motion.span>

      {/* Symbol name */}
      <span className={`text-xs sm:text-sm font-bold tracking-wide ${hasBet ? symbol.color : 'text-gray-400'}`}>
        {symbol.name}
      </span>

      {/* [-] [input] [+] bet controls */}
      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDecrease}
          disabled={disabled || betAmount === 0}
          className="
            w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center
            text-sm font-black transition-all
            bg-gray-700 text-gray-200 hover:bg-gray-600 active:scale-90
            disabled:opacity-30 disabled:cursor-not-allowed
          "
        >
          ∁E
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={inputVal}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="
            flex-1 min-w-0 text-center text-xs font-bold
            bg-gray-800/80 border border-gray-600 rounded-lg py-1 px-0.5
            text-yellow-300 focus:outline-none focus:border-yellow-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />

        <button
          onClick={handleIncrease}
          disabled={disabled || betAmount >= maxBet}
          className="
            w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center
            text-sm font-black transition-all
            bg-yellow-600 text-white hover:bg-yellow-500 active:scale-90
            disabled:opacity-30 disabled:cursor-not-allowed
          "
        >
          +
        </button>
      </div>
    </motion.div>
  );
};
