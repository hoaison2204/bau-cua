import { motion, AnimatePresence } from 'framer-motion';

interface ResultOverlayProps {
  show: boolean;
  result: 'win' | 'lose' | null;
  winAmount: number;
  totalBet: number;
  onClose: () => void;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
  show,
  result,
  winAmount,
  totalBet,
  onClose,
}) => {
  const isWin = result === 'win';

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
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className={`
              relative z-10 flex flex-col items-center gap-4
              rounded-3xl border-2 p-8 sm:p-10 shadow-2xl
              max-w-xs w-full text-center
              ${isWin
                ? 'bg-gray-900 border-yellow-500 shadow-yellow-500/30'
                : 'bg-gray-900 border-red-700 shadow-red-500/20'
              }
            `}
            initial={{ scale: 0.5, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow ring */}
            {isWin && (
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-yellow-400/40"
                animate={{ scale: [1, 1.04, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}

            {/* Icon */}
            <motion.div
              className="text-6xl sm:text-7xl"
              animate={
                isWin
                  ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }
                  : { rotate: [0, -5, 5, 0] }
              }
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {isWin ? '🎉' : '😔'}
            </motion.div>

            {/* Title */}
            <motion.h2
              className={`text-2xl font-black tracking-tight ${isWin ? 'text-yellow-300' : 'text-red-400'}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {isWin ? 'Thắng Rồi! 🏆' : 'Thua Rồi! 💸'}
            </motion.h2>

            {/* Amount */}
            {isWin ? (
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span className="text-sm text-gray-400">Lợi nhuận</span>
                <span className="text-3xl font-black text-green-400">
                  +₫{winAmount.toLocaleString('vi-VN')}
                </span>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <span className="text-sm text-gray-400">Đã mất</span>
                <span className="text-3xl font-black text-red-400">
                  −₫{totalBet.toLocaleString('vi-VN')}
                </span>
              </motion.div>
            )}

            {/* Dismiss button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                mt-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all
                ${isWin
                  ? 'bg-yellow-500 text-gray-950 hover:bg-yellow-400'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }
              `}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              Tiếp tục
            </motion.button>
          </motion.div>

          {/* Win particles */}
          {isWin && <WinParticles />}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Particle effects ────────────────────────────────────────────────────────

const PARTICLE_COLORS = ['#f59e0b', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];
const EMOJIS = ['🎊', '✨', '⭐', '💰', '🎉', '💎'];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji: string;
  delay: number;
}

const WinParticles: React.FC = () => {
  const particles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 40 + 60,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    emoji: EMOJIS[i % EMOJIS.length],
    delay: Math.random() * 0.4,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-lg sm:text-xl"
          style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{
            y: [0, -120, -240],
            opacity: [1, 1, 0],
            scale: [0.5, 1.2, 0.8],
            rotate: [0, Math.random() * 360 - 180],
          }}
          transition={{
            duration: 1.8,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
};
