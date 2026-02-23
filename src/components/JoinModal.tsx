import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinModalProps {
  isOpen: boolean;
  onJoin: (name: string, existingPlayerId?: string) => void;
  isConnecting: boolean;
  error: string | null;
}

const PLAYER_ID_KEY = 'bau-cua-player-id';
const PLAYER_NAME_KEY = 'bau-cua-player-name';

export const JoinModal: React.FC<JoinModalProps> = ({
  isOpen,
  onJoin,
  isConnecting,
  error,
}) => {
  const [name, setName] = useState(() => localStorage.getItem(PLAYER_NAME_KEY) ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem(PLAYER_NAME_KEY, trimmed);
    const existingId = localStorage.getItem(PLAYER_ID_KEY) ?? undefined;
    onJoin(trimmed, existingId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-8 shadow-2xl"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Header */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <motion.div
                className="text-6xl"
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                🎲
              </motion.div>
              <h1 className="text-2xl font-black text-center bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Bầu Cua Tôm Cá
              </h1>
              <p className="text-sm text-gray-400 text-center">
                Nhập tên để tham gia phòng chơi đa người
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tên của bạn
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Nguyễn Văn A..."
                  disabled={isConnecting}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-gray-800 border border-gray-600
                    text-white placeholder-gray-600
                    focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200 text-sm font-medium
                  "
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={!name.trim() || isConnecting}
                whileHover={name.trim() && !isConnecting ? { scale: 1.02 } : {}}
                whileTap={name.trim() && !isConnecting ? { scale: 0.97 } : {}}
                className="
                  w-full py-3.5 rounded-xl font-black text-base
                  bg-gradient-to-r from-yellow-500 to-amber-500
                  text-gray-950 shadow-lg shadow-yellow-500/20
                  disabled:opacity-40 disabled:cursor-not-allowed
                  hover:shadow-yellow-500/40 transition-all duration-200
                  cursor-pointer
                "
              >
                {isConnecting ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                  >
                    Đang kết nối...
                  </motion.span>
                ) : (
                  '🎮 Vào Chơi'
                )}
              </motion.button>
            </form>

            {/* Info */}
            <p className="mt-4 text-center text-xs text-gray-600">
              Số dư khởi điểm: ₫1,000 · Phòng chung: Main
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
