import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Balance } from './Balance';

interface Props {
  balance: number;
  delta: number | null;
  hostName: string | null;
  roomId: string | null;
}

export function BankerBalance({ balance, delta, hostName, roomId }: Props) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="bg-gray-900/70 rounded-2xl border border-gray-800 p-4 text-center">
      <div className="flex items-center justify-between mb-1">
        <div className="text-left">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Banker</p>
          {hostName && <p className="text-xs text-yellow-300 font-semibold truncate max-w-[120px]">{hostName}</p>}
        </div>
        {roomId && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mã phòng</p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <p className="text-lg font-black font-mono text-yellow-400 tracking-widest">{roomId}</p>
              <button
                onClick={copyRoomId}
                title="Sao chép mã phòng"
                className="text-gray-500 hover:text-yellow-400 transition text-sm px-1.5 py-0.5 rounded hover:bg-yellow-400/10"
              >
                {copied ? (
                  <motion.span
                    key="ok"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-green-400 text-xs font-bold"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <span title="Copy">📋</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2">
        <Balance balance={balance} isRolling={false} />
        <p className="text-[10px] text-gray-600 mt-0.5">  số dư banker</p>
      </div>

      <AnimatePresence>
        {delta !== null && delta !== 0 && (
          <motion.p
            key={delta}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`text-sm font-bold mt-2 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {delta > 0 ? '' : ''} {Math.abs(delta).toLocaleString('vi-VN')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
