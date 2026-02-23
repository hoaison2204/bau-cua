import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface BalanceProps {
  balance: number;
  isRolling: boolean;
}

export const Balance: React.FC<BalanceProps> = ({ balance, isRolling }) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [isDecreasing, setIsDecreasing] = useState(false);
  const prevBalanceRef = useRef(balance);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevBalanceRef.current;
    const diff = balance - prev;

    if (diff === 0) return;

    setIsIncreasing(diff > 0);
    setIsDecreasing(diff < 0);

    // Animate number counting
    const duration = 600;
    const startTime = performance.now();
    const startVal = prev;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(startVal + diff * eased));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayBalance(balance);
        setTimeout(() => {
          setIsIncreasing(false);
          setIsDecreasing(false);
        }, 400);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    prevBalanceRef.current = balance;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [balance]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
        Số Dư
      </span>
      <motion.div
        key={balance}
        className={`flex items-center gap-2 text-3xl font-black tracking-tight transition-colors duration-300 ${
          isIncreasing
            ? 'text-green-400'
            : isDecreasing
            ? 'text-red-400'
            : 'text-yellow-300'
        }`}
        animate={
          isIncreasing
            ? { scale: [1, 1.15, 1] }
            : isDecreasing
            ? { scale: [1, 0.9, 1] }
            : {}
        }
        transition={{ duration: 0.4 }}
      >
        <span className="text-yellow-500 text-2xl">₫</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={displayBalance}
            initial={{ opacity: 0.6, y: isIncreasing ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {displayBalance.toLocaleString('vi-VN')}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      {isRolling && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="text-xs text-yellow-400 font-medium"
        >
          Đang lắc...
        </motion.span>
      )}
    </div>
  );
};
