import { motion } from 'framer-motion';

interface Props {
  isHost: boolean;
  isReady: boolean;
  canRoll: boolean;
  isRolling: boolean;
  totalBetAmount: number;
  status: 'waiting' | 'betting' | 'rolling';
  readyCount: number;
  onReady: () => void;
  onRoll: () => void;
  onResetBets: () => void;
}

export function RoomControls({
  isHost,
  isReady,
  canRoll,
  isRolling,
  totalBetAmount,
  status,
  readyCount,
  onReady,
  onRoll,
  onResetBets,
}: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Host: Roll button */}
      {isHost && (
        <div className="flex flex-col gap-2">
          <motion.button
            whileHover={{ scale: canRoll ? 1.03 : 1 }}
            whileTap={{ scale: canRoll ? 0.97 : 1 }}
            onClick={onRoll}
            disabled={!canRoll}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-wide uppercase transition-all shadow-lg ${
              canRoll
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-500/30 hover:from-red-400 hover:to-orange-400'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isRolling ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin text-xl">🎲</span> Đang lắc…
              </span>
            ) : (
              `🎲 Lắc xúc xắc${readyCount > 0 ? ` (${readyCount} ready)` : ''}`
            )}
          </motion.button>
          {readyCount === 0 && !isRolling && (
            <p className="text-xs text-gray-600 text-center">Chờ người chơi sẵn sàng…</p>
          )}
        </div>
      )}

      {/* Player: Bet controls + Ready */}
      {!isHost && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: !isReady ? 1.02 : 1 }}
              whileTap={{ scale: !isReady ? 0.97 : 1 }}
              onClick={onResetBets}
              disabled={isReady || status !== 'betting' || totalBetAmount === 0}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Xoá cược
            </motion.button>

            <motion.button
              whileHover={{ scale: !isReady && totalBetAmount > 0 ? 1.03 : 1 }}
              whileTap={{ scale: !isReady && totalBetAmount > 0 ? 0.97 : 1 }}
              onClick={onReady}
              disabled={isReady || status !== 'betting' || totalBetAmount === 0 || isRolling}
              className={`flex-[2] py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-md ${
                isReady
                  ? 'bg-green-600/50 text-green-300 cursor-not-allowed'
                  : totalBetAmount > 0 && !isRolling && status === 'betting'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30 hover:from-green-400 hover:to-emerald-400'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isReady ? '✓ Đã sẵn sàng' : '✅ Sẵn sàng'}
            </motion.button>
          </div>
          {totalBetAmount === 0 && !isRolling && status === 'betting' && (
            <p className="text-xs text-gray-600 text-center">Đặt cược rồi bấm Sẵn sàng</p>
          )}
          {isReady && (
            <p className="text-xs text-green-500 text-center animate-pulse">Chờ host lắc xúc xắc…</p>
          )}
        </div>
      )}
    </div>
  );
}
