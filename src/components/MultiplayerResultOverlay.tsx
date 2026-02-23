import { motion, AnimatePresence } from 'framer-motion';
import type { RoundResult, GameSymbol } from '../types/multiplayer';
import { SYMBOL_MAP } from '../constants/symbols';

interface MultiplayerResultOverlayProps {
  show: boolean;
  dice: GameSymbol[];
  myResult: RoundResult | null;
  allResults: RoundResult[];
  bankerBalance: number;
  onClose: () => void;
}

const PARTICLE_EMOJIS = ['🎊', '✨', '⭐', '💰', '🎉', '💎'];
const PARTICLE_COUNT = 16;

export const MultiplayerResultOverlay: React.FC<MultiplayerResultOverlayProps> = ({
  show,
  dice,
  myResult,
  allResults,
  bankerBalance,
  onClose,
}) => {
  const isWin = !!myResult && myResult.winAmount > 0;
  const isLose = !!myResult && myResult.winAmount === 0 && myResult.totalBet > 0;
  const nobet = !myResult || myResult.totalBet === 0;
  const winners = allResults.filter((r) => r.winAmount > 0);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          {/* Card */}
          <motion.div
            className={`
              relative z-10 w-full max-w-sm flex flex-col items-center gap-5
              rounded-3xl border-2 p-7 shadow-2xl
              ${isWin
                ? 'bg-gray-900 border-yellow-500 shadow-yellow-500/25'
                : isLose
                ? 'bg-gray-900 border-red-700 shadow-red-500/15'
                : 'bg-gray-900 border-gray-700'
              }
            `}
            initial={{ scale: 0.5, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="text-center">
              <motion.div
                className="text-5xl mb-2"
                animate={isWin ? { rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {isWin ? '🏆' : isLose ? '😔' : '🎲'}
              </motion.div>
              <h2
                className={`text-xl font-black ${
                  isWin ? 'text-yellow-300' : isLose ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {isWin ? 'Bạn Thắng!' : isLose ? 'Bạn Thua!' : 'Kết Quả'}
              </h2>
            </div>

            {/* Dice */}
            <div className="flex items-center gap-2">
              {dice.map((sym, i) => {
                const cfg = SYMBOL_MAP[sym];
                return (
                  <motion.div
                    key={i}
                    className={`
                      w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl
                      ${cfg.bgColor} ${cfg.borderColor}
                    `}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: i * 0.1 + 0.15 }}
                  >
                    {cfg.emoji}
                  </motion.div>
                );
              })}
            </div>

            {/* My result */}
            {!nobet && myResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={`
                  w-full rounded-2xl p-4 text-center border
                  ${isWin
                    ? 'bg-green-950/40 border-green-700/50'
                    : 'bg-red-950/30 border-red-800/40'
                  }
                `}
              >
                <div className="text-xs text-gray-400 mb-1">Kết quả của bạn</div>
                <div
                  className={`text-3xl font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}
                >
                  {isWin
                    ? `+₫${myResult.winAmount.toLocaleString('vi-VN')}`
                    : `-₫${myResult.totalBet.toLocaleString('vi-VN')}`}
                </div>
              </motion.div>
            )}

            {/* Winners list */}
            {winners.length > 0 && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <div className="text-xs text-gray-500 text-center mb-2 uppercase tracking-wider">
                  Người thắng
                </div>
                <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
                  {winners.map((w) => (
                    <div
                      key={w.playerId}
                      className="flex justify-between items-center text-sm px-3 py-1.5 rounded-lg bg-gray-800/60"
                    >
                      <span className="text-gray-300 font-medium truncate">{w.playerName}</span>
                      <span className="text-green-400 font-bold ml-2 flex-shrink-0">
                        +₫{w.winAmount.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {winners.length === 0 && (
              <p className="text-xs text-gray-600 italic">Không ai thắng vòng này</p>
            )}

            {/* Close */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`
                w-full py-3 rounded-xl font-bold text-sm
                ${isWin
                  ? 'bg-yellow-500 text-gray-950 hover:bg-yellow-400'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }
                transition-all cursor-pointer
              `}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Tiếp tục
            </motion.button>
          </motion.div>

          {/* Particles */}
          {isWin && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-xl"
                  style={{ left: `${Math.random() * 100}%`, bottom: `${50 + Math.random() * 30}%` }}
                  initial={{ y: 0, opacity: 1, scale: 0.5 }}
                  animate={{ y: -200, opacity: 0, scale: [0.5, 1.2, 0.8], rotate: Math.random() * 360 - 180 }}
                  transition={{ duration: 1.6, delay: Math.random() * 0.4, ease: 'easeOut' }}
                >
                  {PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length]}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
