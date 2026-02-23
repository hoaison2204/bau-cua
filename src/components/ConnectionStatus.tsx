import { motion, AnimatePresence } from 'framer-motion';

interface ConnectionStatusProps {
  connected: boolean;
  hasJoined: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connected,
  hasJoined,
}) => {
  if (!hasJoined) return null;

  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          connected ? 'bg-green-400' : 'bg-red-400'
        }`}
        animate={
          connected
            ? { scale: [1, 1.3, 1] }
            : { opacity: [1, 0.4, 1] }
        }
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={connected ? 'connected' : 'disconnected'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`text-[10px] font-medium ${
            connected ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {connected ? 'Online' : 'Mất kết nối...'}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
