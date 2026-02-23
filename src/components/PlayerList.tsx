import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../types/multiplayer';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  allBets: Record<string, Record<string, number>>;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
  allBets,
}) => {
  const activePlayers = players.filter((p) => p.isConnected);
  const offlinePlayers = players.filter((p) => !p.isConnected);
  const sorted = [...activePlayers, ...offlinePlayers];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          👥 Người Chơi
        </span>
        <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
          {activePlayers.length} online
        </span>
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {sorted.map((player) => {
            const isMe = player.id === currentPlayerId;
            const playerBets = allBets[player.id] ?? {};
            const totalBet = Object.values(playerBets).reduce(
              (a, b) => a + b,
              0
            );

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: player.isConnected ? 1 : 0.45, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl border
                  ${isMe
                    ? 'border-yellow-500/40 bg-yellow-500/8 ring-1 ring-yellow-500/20'
                    : 'border-gray-700/60 bg-gray-800/50'
                  }
                `}
              >
                {/* Online dot */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    player.isConnected ? 'bg-green-400 shadow-sm shadow-green-400' : 'bg-gray-600'
                  }`}
                />

                {/* Name + badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isMe ? 'text-yellow-300' : 'text-gray-200'
                      }`}
                    >
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        BN
                      </span>
                    )}
                  </div>
                  {/* Balance */}
                  <span className="text-xs text-gray-500">
                    ₫{player.balance.toLocaleString('vi-VN')}
                  </span>
                </div>

                {/* Current bet indicator */}
                {totalBet > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0 text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full"
                  >
                    ₫{totalBet}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="text-center text-xs text-gray-600 py-4">Chưa có ai tham gia</div>
        )}
      </div>
    </div>
  );
};
