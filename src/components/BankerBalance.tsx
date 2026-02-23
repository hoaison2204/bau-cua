import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface BankerBalanceProps {
  balance: number;
  delta: number | null; // null if no round played yet
}

export const BankerBalance: React.FC<BankerBalanceProps> = ({ balance, delta }) => {
  const [display, setDisplay] = useState(balance);
  const prevRef = useRef(balance);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = balance;
    if (from === to) return;

    const start = performance.now();
    const duration = 700;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = balance;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [balance]);

  const isGain = delta !== null && delta > 0;
  const isLoss = delta !== null && delta < 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        🏦 Nhà Cái
      </span>

      {/* Balance card */}
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3 flex flex-col gap-1">
        <span className="text-xs text-gray-500">Số dư nhà cái</span>
        <motion.div
          key={balance}
          className={`text-xl font-black ${
            isGain ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-yellow-300'
          }`}
          animate={
            isGain
              ? { scale: [1, 1.08, 1] }
              : isLoss
              ? { scale: [1, 0.94, 1] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          ₫{display.toLocaleString('vi-VN')}
        </motion.div>

        {/* Delta indicator */}
        <AnimatePresence>
          {delta !== null && delta !== 0 && (
            <motion.div
              key={delta}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`text-xs font-semibold ${
                isGain ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isGain ? '▲' : '▼'} ₫{Math.abs(delta).toLocaleString('vi-VN')} vòng này
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
