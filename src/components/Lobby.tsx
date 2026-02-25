import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RoomSummary } from '../types/multiplayer';

interface Props {
  rooms: RoomSummary[];
  connected: boolean;
  error: string | null;
  onCreateRoom: (hostName: string, bankerBalance: number) => void;
  onJoinRoom: (roomId: string, playerName: string, startingBalance: number) => void;
  onConnect: () => void;
  onDismissError: () => void;
}

export function Lobby({
  rooms,
  connected,
  error,
  onCreateRoom,
  onJoinRoom,
  onConnect,
  onDismissError,
}: Props) {
  const [tab, setTab] = useState<'rooms' | 'create' | 'join'>('rooms');
  const [name, setName] = useState(() => localStorage.getItem('bau-cua-player-name') ?? '');
  const [joinId, setJoinId] = useState('');
  const [nameError, setNameError] = useState(false);
  const [bankerBalance, setBankerBalance] = useState(100_000);
  const [startingBalance, setStartingBalance] = useState(10_000);

  useEffect(() => {
    onConnect();
  }, []);

  const requireName = (): boolean => {
    if (!name.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 1200);
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!requireName()) return;
    onCreateRoom(name.trim(), bankerBalance);
  };

  const handleJoin = (roomId: string) => {
    if (!requireName()) return;
    onJoinRoom(roomId, name.trim(), startingBalance);
  };

  const handleJoinById = () => {
    if (!requireName()) return;
    if (!joinId.trim()) return;
    onJoinRoom(joinId.trim().toUpperCase(), name.trim(), startingBalance);
  };

  const statusBadge = (s: RoomSummary['status']) => {
    if (s === 'waiting') return <span className="text-[10px] font-bold text-yellow-400 uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded">Chờ</span>;
    if (s === 'betting') return <span className="text-[10px] font-bold text-green-400 uppercase bg-green-400/10 px-1.5 py-0.5 rounded">Đang chơi</span>;
    return <span className="text-[10px] font-bold text-orange-400 uppercase bg-orange-400/10 px-1.5 py-0.5 rounded">Lắc</span>;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      {/* Ambient BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.07)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
            🎲 Bầu Cua Tôm Cá
          </h1>
          <p className="text-gray-500 text-sm mt-1">Multiplayer · Room System</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{connected ? 'Đã kết nối' : 'Đang kết nối...'}</span>
          </div>
        </motion.div>

        {/* Name input — always visible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <motion.input
            value={name}
            onChange={(e) => { setName(e.target.value); setNameError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && requireName()}
            placeholder="Nhập tên của bạn…"
            maxLength={24}
            animate={nameError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={`w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-1 transition ${
              nameError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-gray-700 focus:border-yellow-500 focus:ring-yellow-500/50'
            }`}
          />
          <AnimatePresence>
            {nameError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 text-xs text-red-400 pl-1"
              >
                Vui lòng nhập tên trước khi tiếp tục
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 text-sm text-red-300 flex items-center justify-between"
            >
              <span>{error}</span>
              <button onClick={onDismissError} className="text-red-400 hover:text-white ml-4 text-lg leading-none">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
        >
          {/* Tab headers */}
          <div className="flex border-b border-gray-800">
            {(['rooms', 'create', 'join'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  tab === t
                    ? 'text-yellow-400 border-b-2 border-yellow-500 -mb-px bg-gray-800/50'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'rooms' ? '🏠 Danh sách phòng' : t === 'create' ? '➕ Tạo phòng' : '🔑 Vào phòng'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Rooms list */}
            {tab === 'rooms' && (
              <div>
                {rooms.length === 0 ? (
                  <div className="text-center text-gray-600 py-8">
                    <p className="text-3xl mb-2">🎲</p>
                    <p className="text-sm">Chưa có phòng nào. Hãy tạo phòng mới!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {rooms.map((room) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 border border-gray-700/50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-yellow-400 text-sm">{room.id}</span>
                            {statusBadge(room.status)}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Host: <span className="text-white">{room.hostName}</span>
                            &nbsp;·&nbsp;
                            <span>{room.playerCount}/{room.maxPlayers}</span> người chơi
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoin(room.id)}
                          disabled={room.playerCount >= room.maxPlayers}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          {room.playerCount >= room.maxPlayers ? 'Đầy' : 'Vào'}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create room */}
            {tab === 'create' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Bạn sẽ là <span className="text-yellow-400 font-bold">HOST & BANKER</span>. Host không đặt cược, chỉ lắc xúc xắc.</p>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Vốn nhà cái (Banker Balance)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={bankerBalance}
                    onChange={(e) => setBankerBalance(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || !connected}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  🎲 Tạo phòng mới
                </button>
              </div>
            )}

            {/* Join by ID */}
            {tab === 'join' && (
              <div className="space-y-3">
                <input
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng (VD: BC843K)…"
                  maxLength={8}
                  className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm font-mono border border-gray-700 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition"
                />
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Số tiền bắt đầu (Starting Balance)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition"
                  />
                </div>
                <button
                  onClick={handleJoinById}
                  disabled={!name.trim() || !joinId.trim() || !connected}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 hover:from-yellow-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  🔑 Vào phòng
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
