import { motion } from 'framer-motion';
import type { SymbolConfig } from '../types/game';

interface BetTileProps {
  symbol: SymbolConfig;
  betAmount: number;
  isWinning: boolean;
  isRolling: boolean;
  onAddBet: () => void;
  onRemoveBet: () => void;
}

export const BetTile: React.FC<BetTileProps> = ({
  symbol,
  betAmount,
  isWinning,
  isRolling,
  onAddBet,
  onRemoveBet,
}) => {
  const hasBet = betAmount > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRolling) onRemoveBet();
  };

  const handleClick = () => {
    if (!isRolling) onAddBet();
  };

  return (
    <motion.div
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl border-2 cursor-pointer select-none
        p-3 sm:p-4 gap-1 sm:gap-2
        transition-all duration-200
        ${isRolling ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${hasBet
          ? `${symbol.borderColor} ${symbol.bgColor} shadow-lg ${isWinning ? 'ring-2 ring-yellow-400' : ''}`
          : 'border-gray-700 bg-gray-900/60 hover:border-gray-500'
        }
        ${isWinning ? `shadow-[0_0_24px_4px] ${symbol.glowColor} animate-pulse` : ''}
      `}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      whileHover={!isRolling ? { scale: 1.05 } : {}}
      whileTap={!isRolling ? { scale: 0.96 } : {}}
      animate={
        isWinning
          ? {
              scale: [1, 1.08, 1, 1.06, 1],
              transition: {
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.3,
              },
            }
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
      <span
        className={`text-xs sm:text-sm font-bold tracking-wide ${
          hasBet ? symbol.color : 'text-gray-400'
        }`}
      >
        {symbol.name}
      </span>

      {/* Bet amount chip */}
      <div className="h-6 flex items-center justify-center min-w-[3rem]">
        {hasBet ? (
          <motion.div
            key={betAmount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`
              px-2 py-0.5 rounded-full text-xs font-black
              bg-yellow-500/20 text-yellow-300 border border-yellow-500/40
            `}
          >
            ₫{betAmount.toLocaleString('vi-VN')}
          </motion.div>
        ) : (
          <span className="text-xs text-gray-600 italic">Nhấn để cược</span>
        )}
      </div>

      {/* Instructions hint on hover */}
      <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100">
        <span className="text-[9px] text-gray-600">RMB -₫</span>
      </div>
    </motion.div>
  );
};
