import { motion } from 'framer-motion';
import { Dice } from './Dice';
import type { GameSymbol } from '../types/game';

interface DiceContainerProps {
  dice: GameSymbol[];
  isRolling: boolean;
}

export const DiceContainer: React.FC<DiceContainerProps> = ({ dice, isRolling }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <motion.div
          className="h-px flex-1 bg-gradient-to-r from-transparent to-yellow-500/50 w-12"
          animate={{ opacity: isRolling ? [0.4, 1, 0.4] : 1 }}
          transition={{ duration: 0.6, repeat: isRolling ? Infinity : 0 }}
        />
        <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-widest px-3">
          🎲 Xúc Xắc
        </span>
        <motion.div
          className="h-px flex-1 bg-gradient-to-l from-transparent to-yellow-500/50 w-12"
          animate={{ opacity: isRolling ? [0.4, 1, 0.4] : 1 }}
          transition={{ duration: 0.6, repeat: isRolling ? Infinity : 0 }}
        />
      </div>

      {/* Dice row */}
      <motion.div
        className="flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-3xl border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm shadow-2xl"
        animate={
          isRolling
            ? { boxShadow: ['0 0 20px rgba(234,179,8,0.1)', '0 0 40px rgba(234,179,8,0.4)', '0 0 20px rgba(234,179,8,0.1)'] }
            : { boxShadow: '0 0 20px rgba(0,0,0,0.3)' }
        }
        transition={{ duration: 0.7, repeat: isRolling ? Infinity : 0 }}
      >
        {dice.map((symbol, idx) => (
          <Dice
            key={idx}
            symbol={symbol}
            isRolling={isRolling}
            index={idx}
          />
        ))}
      </motion.div>

      {/* Status label */}
      <div className="h-5 flex items-center justify-center">
        {isRolling ? (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-yellow-400"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
            <span className="text-xs text-yellow-400 font-semibold tracking-wide">
              Đang lắc...
            </span>
            <motion.div
              className="w-2 h-2 rounded-full bg-yellow-400"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: 0.25 }}
            />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};
