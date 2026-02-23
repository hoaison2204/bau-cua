import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { GameSymbol } from '../types/game';
import { SYMBOL_MAP, ALL_SYMBOLS } from '../constants/symbols';

interface DiceProps {
  symbol: GameSymbol;
  isRolling: boolean;
  index: number;
}

const randomSymbol = (): GameSymbol =>
  ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];

export const Dice: React.FC<DiceProps> = ({ symbol, isRolling, index }) => {
  const controls = useAnimation();
  const [flickerSymbol, setFlickerSymbol] = useState<GameSymbol>(symbol);

  // Animate the die when rolling state changes
  useEffect(() => {
    if (isRolling) {
      controls.start({
        rotate: [0, 90, 180, 270, 360, 450, 720],
        scale: [1, 0.85, 1.2, 0.9, 1.1, 0.95, 1],
        transition: {
          duration: 1.5,
          ease: 'easeInOut',
          delay: index * 0.07,
        },
      });
    } else {
      // Final landing bounce
      controls.start({
        scale: [1.35, 0.88, 1.12, 0.96, 1],
        rotate: 0,
        transition: {
          duration: 0.55,
          ease: 'easeOut',
          delay: index * 0.1,
        },
      });
    }
  }, [isRolling, controls, index]);

  // Flicker random symbols while rolling
  useEffect(() => {
    if (!isRolling) {
      setFlickerSymbol(symbol);
      return;
    }

    const interval = setInterval(() => {
      setFlickerSymbol(randomSymbol());
    }, 75);

    return () => clearInterval(interval);
  }, [isRolling, symbol]);

  const shownSymbol = isRolling ? flickerSymbol : symbol;
  const config = SYMBOL_MAP[shownSymbol];

  return (
    <motion.div
      animate={controls}
      style={{ transformOrigin: 'center' }}
      className={`
        relative w-20 h-20 sm:w-24 sm:h-24
        rounded-2xl border-2 flex items-center justify-center
        shadow-xl select-none overflow-hidden
        ${isRolling
          ? 'border-yellow-400/60 bg-gray-800 shadow-yellow-500/30'
          : `${config.borderColor} ${config.bgColor}`
        }
      `}
    >
      {/* Shimmer overlay when rolling */}
      {isRolling && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-2xl"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}

      {/* Win glow overlay */}
      {!isRolling && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Symbol emoji */}
      <motion.span
        key={shownSymbol}
        initial={{ scale: 0.4, opacity: 0.2, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          duration: isRolling ? 0.07 : 0.35,
          ease: isRolling ? 'linear' : 'backOut',
        }}
        className="text-4xl sm:text-5xl leading-none z-10 drop-shadow-lg"
      >
        {config.emoji}
      </motion.span>

      {/* Corner accent lines */}
      <div className="absolute inset-1.5 rounded-xl border border-white/5 pointer-events-none" />
    </motion.div>
  );
};
