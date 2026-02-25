import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoundPlayerResult, GameSymbol } from '../types/multiplayer';
import { SYMBOL_MAP } from '../constants/symbols';

interface Props {
  show: boolean;
  dice: GameSymbol[];
  myResult: RoundPlayerResult | undefined;
  allResults: RoundPlayerResult[];
  isHost: boolean;
  onClose: () => void;
}

export function MultiplayerResultOverlay({ show, dice, myResult, allResults, isHost, onClose }: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (show) {
      timerRef.current = setTimeout(onClose, 6000);
    }
    return () => clearTimeout(timerRef.current);
  }, [show, onClose]);

  const profit = myResult?.profit ?? 0;
  const hasBet = !isHost && myResult && myResult.totalBet > 0;
  const won = hasBet && profit > 0;
  const lost = hasBet && profit < 0;
  const breakEven = hasBet && profit === 0;

  // Shake animation keyframes for loss
  const shakeAnim = lost
    ? { x: [0, -12, 12, -10, 10, -6, 6, 0] }
    : {};
  const shakeTransition = lost
    ? { duration: 0.6, ease: 'easeInOut' }
    : {};

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Fireworks / confetti for win */}
          {won && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, x: `${Math.random() * 100}vw`, y: '-10px', rotate: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    y: '110vh',
                    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                    scale: Math.random() * 0.5 + 0.5,
                  }}
                  transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.8 }}
                  className="absolute text-2xl select-none"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {['🎉', '✨', '💰', '🏆', '⭐'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0, ...shakeAnim }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, ...shakeTransition }}
            className={`relative bg-gray-900 border rounded-3xl p-6 max-w-sm w-full shadow-2xl ${
              won ? 'border-yellow-500/50' : lost ? 'border-red-700/50' : 'border-gray-700'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dice */}
            <div className="flex justify-center gap-3 mb-4">
              {dice.map((sym, i) => {
                const cfg = SYMBOL_MAP[sym];
                return (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-gray-800 border-2 shadow-lg ${cfg.borderColor}`}
                  >
                    {cfg.emoji}
                  </motion.div>
                );
              })}
            </div>

            {/* Result title */}
            {isHost ? (
              <p className="text-center text-gray-400 font-semibold text-sm">Kết quả vòng</p>
            ) : won ? (
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.4 }}
                className="text-center text-2xl font-black text-yellow-400"
              >
                🎉 Bạn thắng!
              </motion.p>
            ) : lost ? (
              <p className="text-center text-xl font-black text-red-400">😔 Bạn thua</p>
            ) : breakEven ? (
              <motion.p
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-center text-lg font-black text-blue-300"
              >
                😐 Hoà vốn
              </motion.p>
            ) : (
              <p className="text-center text-gray-400 font-semibold text-sm">Không có cược</p>
            )}

            {/* My result detail */}
            {myResult && hasBet && (
              <div className={`mt-3 rounded-xl p-3 text-center ${
                won
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : lost
                  ? 'bg-red-900/20 border border-red-700/20'
                  : 'bg-blue-900/20 border border-blue-700/20'
              }`}>
                <p className="text-xs text-gray-500 mb-1">
                  Cược: {myResult.totalBet.toLocaleString('vi-VN')}
                </p>
                {profit > 0 ? (
                  <p className="text-lg font-black text-yellow-400">
                    +{profit.toLocaleString('vi-VN')}
                  </p>
                ) : profit < 0 ? (
                  <p className="text-lg font-black text-red-400">
                    {profit.toLocaleString('vi-VN')}
                  </p>
                ) : (
                  <p className="text-lg font-black text-blue-300">±0</p>
                )}
              </div>
            )}

            {/* All results list */}
            {allResults.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Kết quả vòng</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {allResults.map((r) => (
                    <div key={r.playerId} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 truncate">{r.playerName}</span>
                      {r.profit > 0 ? (
                        <span className="text-green-400 font-bold">+{r.profit.toLocaleString('vi-VN')}</span>
                      ) : r.profit < 0 ? (
                        <span className="text-red-400 font-bold">{r.profit.toLocaleString('vi-VN')}</span>
                      ) : (
                        <span className="text-gray-500 font-bold">±0</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm text-gray-400 transition"
            >
              Đóng
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
