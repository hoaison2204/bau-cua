import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { useSocketEvents } from './hooks/useSocketEvents';
import { GameBoard } from './components/GameBoard';
import { DiceContainer } from './components/DiceContainer';
import { Balance } from './components/Balance';
import { Controls } from './components/Controls';
import { JoinModal } from './components/JoinModal';
import { PlayerList } from './components/PlayerList';
import { BankerBalance } from './components/BankerBalance';
import { RoundHistory } from './components/RoundHistory';
import { ConnectionStatus } from './components/ConnectionStatus';
import { MultiplayerResultOverlay } from './components/MultiplayerResultOverlay';
import type { GameSymbol } from './types/game';

function App() {
  // Attach all socket event listeners globally
  useSocketEvents();

  const game = useMultiplayerGame();

  // Play result sounds when result arrives
  useEffect(() => {
    if (game.showResult) {
      game.handleResultSound();
    }
  }, [game.showResult]);

  // Derive winning symbols for the GameBoard highlight
  const winningSymbols: GameSymbol[] = game.showResult
    ? game.dice.filter((d) => (game.myBets as Record<string, number>)[d] > 0) as GameSymbol[]
    : [];

  const myBalance = game.myPlayer?.balance ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.06)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.04)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/*  Header  */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
               Bầu Cua Tôm Cá
            </h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest hidden sm:block">Multiplayer  Room: Main</p>
          </div>

          <div className="flex items-center gap-4">
            {game.hasJoined && game.playerName && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:flex flex-col items-end"
              >
                <span className="text-xs font-semibold text-yellow-300">{game.playerName}</span>
                <span className="text-xs text-gray-500">{myBalance.toLocaleString('vi-VN')}</span>
              </motion.div>
            )}
            <ConnectionStatus connected={game.connected} hasJoined={game.hasJoined} />
          </div>
        </header>

        {/*  Main content  */}
        {game.hasJoined ? (
          <main className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full">

            {/*  LEFT: Game board  */}
            <motion.section
              className="flex flex-col gap-4 lg:min-w-[280px]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Balance (mobile only) */}
              <div className="lg:hidden flex justify-center py-2 px-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                <Balance balance={myBalance} isRolling={game.isRolling} />
              </div>

              <GameBoard
                bets={game.myBets as Record<GameSymbol, number>}
                winningSymbols={winningSymbols}
                isRolling={game.isRolling}
                onAddBet={(sym) => game.addBet(sym as GameSymbol)}
                onRemoveBet={(sym) => game.removeBet(sym as GameSymbol)}
              />
            </motion.section>

            {/*  CENTER: Dice + Controls  */}
            <motion.section
              className="flex flex-col items-center gap-4 lg:gap-5 lg:w-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {/* Balance (desktop) */}
              <div className="hidden lg:flex w-full justify-center py-3 px-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                <Balance balance={myBalance} isRolling={game.isRolling} />
              </div>

              <DiceContainer
                dice={game.dice as GameSymbol[]}
                isRolling={game.isRolling}
              />

              <div className="w-full">
                <Controls
                  canRoll={game.canRoll}
                  isRolling={game.isRolling}
                  totalBetAmount={game.totalBetAmount}
                  onRoll={game.rollDice}
                  onResetBets={game.resetBets}
                  onResetGame={game.resetBets}
                />
              </div>

              {/* Error display */}
              {game.error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2 text-center w-full"
                >
                   {game.error}
                </motion.div>
              )}
            </motion.section>

            {/*  RIGHT: Players + Banker + History  */}
            <motion.section
              className="flex flex-col gap-5 lg:min-w-[260px]"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <BankerBalance balance={game.bankerBalance} delta={game.bankerDelta} />

              <div className="h-px bg-gray-800/60" />

              <PlayerList
                players={game.players}
                currentPlayerId={game.playerId}
                allBets={game.allBets}
              />

              <div className="h-px bg-gray-800/60" />

              <RoundHistory
                history={game.history}
                currentPlayerId={game.playerId}
              />
            </motion.section>
          </main>
        ) : (
          /* Waiting for join */
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-600 text-sm"
            >
              Đang tải...
            </motion.div>
          </div>
        )}

        {/*  Footer  */}
        <footer className="text-center py-3 text-[10px] text-gray-700 font-medium border-t border-gray-800/40">
          Chỉ để giải trí  Không có tiền thật
        </footer>
      </div>

      {/*  Join modal  */}
      <JoinModal
        isOpen={!game.hasJoined}
        onJoin={game.joinGame}
        isConnecting={game.connected && !game.hasJoined}
        error={!game.hasJoined ? game.error : null}
      />

      {/*  Result overlay  */}
      <MultiplayerResultOverlay
        show={game.showResult}
        dice={game.dice as GameSymbol[]}
        myResult={game.myResult}
        allResults={game.lastResults}
        bankerBalance={game.bankerBalance}
        onClose={game.hideResult}
      />
    </div>
  );
}

export default App;
