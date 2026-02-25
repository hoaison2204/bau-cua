import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { useSocketEvents } from './hooks/useSocketEvents';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { DiceContainer } from './components/DiceContainer';
import { Balance } from './components/Balance';
import { RoomControls } from './components/RoomControls';
import { PlayerList } from './components/PlayerList';
import { BankerBalance } from './components/BankerBalance';
import { RoundHistory } from './components/RoundHistory';
import { ConnectionStatus } from './components/ConnectionStatus';
import { MultiplayerResultOverlay } from './components/MultiplayerResultOverlay';

function App() {
  useSocketEvents();
  const game = useMultiplayerGame();

  useEffect(() => {
    if (game.showResult) {
      game.handleResultSound();
    }
  }, [game.showResult]);

  const winningSymbols: string[] = game.showResult
    ? game.dice.filter((d) => (game.myBets as Record<string, number>)[d] > 0)
    : [];

  //  Lobby
  if (game.screen === 'lobby') {
    return (
      <Lobby
        rooms={game.rooms}
        connected={game.connected}
        error={game.error}
        onCreateRoom={game.createRoom}
        onJoinRoom={game.joinRoom}
        onConnect={game.connect}
        onDismissError={game.dismissError}
      />
    );
  }

  //  Room
  const myBalance = game.myPlayer?.balance ?? game.bankerBalance;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Ambient gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.04)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
               Bầu Cua Tôm Cá
            </h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest hidden sm:block font-mono">
              {game.roomId ?? ''}
              {game.isHost && <span className="ml-2 text-yellow-600">HOST</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {game.playerName && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex flex-col items-end"
              >
                <span className="text-xs font-semibold text-yellow-300">{game.playerName}</span>
                <span className="text-xs text-gray-500">{myBalance.toLocaleString('vi-VN')} </span>
              </motion.div>
            )}
            <button
              onClick={game.leaveRoom}
              className="text-xs text-gray-500 hover:text-red-400 transition px-2 py-1 rounded border border-gray-800 hover:border-red-800"
            >
              Rời phòng
            </button>
            <ConnectionStatus connected={game.connected} hasJoined={game.screen === 'room'} />
          </div>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {game.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-900/50 border-b border-red-800 px-4 py-2 text-sm text-red-300 flex items-center justify-between"
            >
              <span>{game.error}</span>
              <button onClick={game.dismissError} className="text-red-400 hover:text-white ml-4"></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main */}
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full">

          {/* LEFT: Game board */}
          <motion.section
            className="flex flex-col gap-4 lg:min-w-[280px]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Balance (player only) */}
            {!game.isHost && (
              <Balance balance={myBalance} isRolling={game.isRolling} />
            )}

            <GameBoard
              bets={game.myBets as Record<string, number>}
              winningSymbols={winningSymbols as string[]}
              isRolling={game.isRolling}
              disabled={game.isHost || game.isRolling || game.isReady || game.status !== 'betting'}
              onAddBet={game.addBet as (s: string) => void}
              onRemoveBet={game.removeBet as (s: string) => void}
            />

            {/* Controls */}
            <RoomControls
              isHost={game.isHost}
              isReady={game.isReady}
              canRoll={game.canRoll}
              isRolling={game.isRolling}
              totalBetAmount={game.totalBetAmount}
              status={game.status}
              readyCount={game.readyPlayers.length}
              onReady={game.setReady}
              onRoll={game.rollDice}
              onResetBets={game.resetBets}
            />
          </motion.section>

          {/* CENTER: Dice */}
          <motion.section
            className="flex flex-col items-center justify-start gap-4 lg:mx-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DiceContainer dice={game.dice} isRolling={game.isRolling} />
          </motion.section>

          {/* RIGHT: Banker + Players + History */}
          <motion.section
            className="flex flex-col gap-4 lg:min-w-[280px]"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BankerBalance
              balance={game.bankerBalance}
              delta={game.bankerDelta}
              hostName={game.hostName}
              roomId={game.roomId}
            />

            <PlayerList
              players={game.players}
              hostId={game.hostId}
              hostName={game.hostName}
              readyPlayers={game.readyPlayers}
              currentPlayerId={game.playerId}
            />

            <RoundHistory
              history={game.history}
              currentPlayerId={game.playerId}
            />
          </motion.section>

        </main>
      </div>

      {/* Result overlay */}
      <MultiplayerResultOverlay
        show={game.showResult}
        dice={game.dice}
        myResult={game.myResult}
        allResults={game.lastResults}
        isHost={game.isHost}
        onClose={game.hideResult}
      />
    </div>
  );
}

export default App;
