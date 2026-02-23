import { motion, AnimatePresence } from 'framer-motion';
import type { RoundHistory as RoundHistoryType } from '../types/multiplayer';
import { SYMBOL_MAP } from '../constants/symbols';

interface RoundHistoryProps {
  history: RoundHistoryType[];
  currentPlayerId: string | null;
}

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const RoundHistory: React.FC<RoundHistoryProps> = ({ history, currentPlayerId }) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          📜 Lịch Sử
        </span>
        {history.length > 0 && (
          <span className="text-xs text-gray-600">{history.length} vòng</span>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {history.map((round, idx) => {
            const winners = round.results.filter((r) => r.winAmount > 0);
            const myResult = round.results.find((r) => r.playerId === currentPlayerId);
            const didIWin = myResult && myResult.winAmount > 0;
            const didILose = myResult && myResult.winAmount === 0 && myResult.totalBet > 0;

            return (
              <motion.div
                key={round.id}
                layout
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: idx === 0 ? 0 : 0 }}
                className={`
                  rounded-xl border p-3 flex flex-col gap-2
                  ${didIWin
                    ? 'border-green-700/60 bg-green-950/30'
                    : didILose
                    ? 'border-red-800/40 bg-red-950/20'
                    : 'border-gray-700/50 bg-gray-800/40'
                  }
                `}
              >
                {/* Round header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">
                    Vòng #{round.roundNumber}
                  </span>
                  <span className="text-[10px] text-gray-600">{formatTime(round.timestamp)}</span>
                </div>

                {/* Dice result */}
                <div className="flex items-center gap-1">
                  {round.dice.map((sym, i) => {
                    const config = SYMBOL_MAP[sym];
                    return (
                      <div
                        key={i}
                        className={`
                          w-8 h-8 rounded-lg border flex items-center justify-center text-base
                          ${config.bgColor} ${config.borderColor}
                        `}
                        title={config.name}
                      >
                        {config.emoji}
                      </div>
                    );
                  })}

                  {/* Banker delta */}
                  <div className="ml-auto text-[10px]">
                    <span className={round.bankerDelta >= 0 ? 'text-green-500' : 'text-red-400'}>
                      {round.bankerDelta >= 0 ? '+' : ''}₫{round.bankerDelta.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* My result */}
                {myResult && (
                  <div
                    className={`text-xs font-semibold ${
                      didIWin ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {didIWin
                      ? `Bạn thắng +₫${myResult.winAmount.toLocaleString('vi-VN')}`
                      : `Bạn thua -₫${myResult.totalBet.toLocaleString('vi-VN')}`}
                  </div>
                )}

                {/* Winners */}
                {winners.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {winners.slice(0, 3).map((w) => (
                      <span
                        key={w.playerId}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                          w.playerId === currentPlayerId
                            ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                            : 'bg-gray-700/50 border-gray-600/50 text-gray-400'
                        }`}
                      >
                        {w.playerName} +{w.winAmount}
                      </span>
                    ))}
                    {winners.length > 3 && (
                      <span className="text-[10px] text-gray-600">+{winners.length - 3} nữa</span>
                    )}
                  </div>
                )}

                {winners.length === 0 && (
                  <div className="text-[10px] text-gray-600 italic">Không ai thắng vòng này</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {history.length === 0 && (
          <div className="text-xs text-gray-600 text-center py-6 italic">
            Chưa có vòng chơi nào
          </div>
        )}
      </div>
    </div>
  );
};
