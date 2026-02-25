import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../types/multiplayer';

interface Props {
  players: Player[];
  hostName: string | null;
  confirmedPlayers: string[];
  currentPlayerId: string | null;
}

export function PlayerList({ players, hostName, confirmedPlayers, currentPlayerId }: Props) {
  return (
    <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
        Người chơi ({players.length})
      </h3>

      <ul className="space-y-2">
        {/* Host row */}
        {hostName && (
          <motion.li
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2"
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-yellow-300 truncate">{hostName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase">HOST</span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase">BANKER</span>
              </div>
            </div>
          </motion.li>
        )}

        {/* Player rows */}
        <AnimatePresence initial={false}>
          {players.map((p) => {
            const isConfirmed = confirmedPlayers.includes(p.id);
            const isMe = p.id === currentPlayerId;
            const isOffline = !p.isConnected;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: isOffline ? 0.4 : 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border transition-colors ${
                  isConfirmed
                    ? 'bg-green-500/10 border-green-500/20'
                    : isMe
                    ? 'bg-gray-800 border-gray-700'
                    : 'bg-gray-800/50 border-gray-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isOffline
                      ? 'bg-gray-600'
                      : isConfirmed
                      ? 'bg-green-400 animate-pulse'
                      : 'bg-gray-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-blue-300' : 'text-white'}`}>
                      {p.name}
                      {isMe && <span className="text-[10px] text-gray-500 ml-1">(bạn)</span>}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {p.balance.toLocaleString('vi-VN')}
                  </p>
                </div>

                {isConfirmed && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase"
                  >
                    Đã Đặt
                  </motion.span>
                )}

                {isOffline && (
                  <span className="text-[10px] text-gray-600">offline</span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
