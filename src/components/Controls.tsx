import { motion } from 'framer-motion';

interface ControlsProps {
  canRoll: boolean;
  isRolling: boolean;
  totalBetAmount: number;
  onRoll: () => void;
  onResetBets: () => void;
  onResetGame: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  canRoll,
  isRolling,
  totalBetAmount,
  onRoll,
  onResetBets,
  onResetGame,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Main roll button */}
      <motion.button
        onClick={onRoll}
        disabled={!canRoll}
        whileHover={canRoll ? { scale: 1.03 } : {}}
        whileTap={canRoll ? { scale: 0.96 } : {}}
        className={`
          relative w-full py-4 rounded-2xl font-black text-lg tracking-wide
          transition-all duration-200 overflow-hidden select-none
          ${canRoll
            ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 cursor-pointer'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
          }
        `}
      >
        {/* Shimmer effect on active */}
        {canRoll && !isRolling && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            animate={{ x: ['-200%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}

        {isRolling ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            🎲 Đang Lắc...
          </motion.span>
        ) : (
          <span className="relative z-10">
            🎲 Lắc
            {totalBetAmount > 0 && (
              <span className="ml-2 text-sm font-semibold opacity-80">
                (₫{totalBetAmount.toLocaleString('vi-VN')})
              </span>
            )}
          </span>
        )}
      </motion.button>

      {/* Secondary buttons */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={onResetBets}
          disabled={isRolling}
          whileHover={!isRolling ? { scale: 1.02 } : {}}
          whileTap={!isRolling ? { scale: 0.97 } : {}}
          className={`
            py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200
            ${isRolling
              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-800'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 cursor-pointer'
            }
          `}
        >
          🗑️ Xóa Cược
        </motion.button>

        <motion.button
          onClick={onResetGame}
          disabled={isRolling}
          whileHover={!isRolling ? { scale: 1.02 } : {}}
          whileTap={!isRolling ? { scale: 0.97 } : {}}
          className={`
            py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200
            ${isRolling
              ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-800'
              : 'bg-red-950/50 text-red-400 hover:bg-red-900/50 hover:text-red-300 border border-red-900 cursor-pointer'
            }
          `}
        >
          🔄 Chơi Lại
        </motion.button>
      </div>
    </div>
  );
};
