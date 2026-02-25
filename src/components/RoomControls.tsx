import { motion } from 'framer-motion';

interface Props {
  isHost: boolean;
  isConfirmed: boolean;
  canRoll: boolean;
  isRolling: boolean;
  totalBetAmount: number;
  status: 'waiting' | 'betting' | 'rolling';
  confirmedCount: number;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onRoll: () => void;
  onResetBets: () => void;
}

export function RoomControls({
  isHost,
  isConfirmed,
  canRoll,
  isRolling,
  totalBetAmount,
  status,
  confirmedCount,
  onConfirm,
  onUnconfirm,
  onRoll,
  onResetBets,
}: Props) {
  const isBetting = status === 'betting';

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
              `🎲 Lắc xúc xắc${confirmedCount > 0 ? ` (${confirmedCount} đã đặt)` : ''}`
            )}
          </motion.button>
          {confirmedCount === 0 && !isRolling && (
            <p className="text-xs text-gray-600 text-center">Chờ người chơi xác nhận cược…</p>
          )}
        </div>
      )}

      {/* Player: Bet controls + Dat/Huy Dat */}
      {!isHost && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* Reset bets — only when NOT confirmed */}
            {!isConfirmed && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onResetBets}
                disabled={!isBetting || totalBetAmount === 0 || isRolling}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Xoá cược
              </motion.button>
            )}

            {/* Dat / Huy Dat */}
            {isConfirmed ? (
              <motion.button
                whileHover={{ scale: !isRolling ? 1.02 : 1 }}
                whileTap={{ scale: !isRolling ? 0.97 : 1 }}
                onClick={onUnconfirm}
                disabled={isRolling}
                className="flex-[2] py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-md bg-orange-600/70 text-orange-200 hover:bg-orange-500/70 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↩ Huỷ Đặt
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: totalBetAmount > 0 && isBetting && !isRolling ? 1.03 : 1 }}
                whileTap={{ scale: totalBetAmount > 0 && isBetting && !isRolling ? 0.97 : 1 }}
                onClick={onConfirm}
                disabled={!isBetting || totalBetAmount === 0 || isRolling}
                className={`flex-[2] py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all shadow-md ${
                  totalBetAmount > 0 && isBetting && !isRolling
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30 hover:from-green-400 hover:to-emerald-400'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                ✅ Đặt
              </motion.button>
            )}
          </div>

          {/* Hint messages */}
          {!isConfirmed && totalBetAmount === 0 && isBetting && !isRolling && (
            <p className="text-xs text-gray-600 text-center">Đặt số tiền rồi bấm Đặt để xác nhận</p>
          )}
          {isConfirmed && !isRolling && (
            <p className="text-xs text-green-500 text-center animate-pulse">
              Đã xác nhận · Chờ host lắc xúc xắc…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
