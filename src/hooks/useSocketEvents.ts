import { useEffect } from 'react';
import { useAppDispatch } from './useAppStore';
import { getSocket } from '../lib/socket';
import {
  setConnected,
  setError,
  syncRoomState,
  playerJoined,
  playerLeft,
  betsUpdated,
  setRolling,
  diceResult,
} from '../features/game/multiplayerSlice';
import type {
  GameStatePayload,
  DiceResultPayload,
  PlayerJoinedPayload,
  PlayerLeftPayload,
  BetsUpdatedPayload,
  ErrorPayload,
} from '../types/socketEvents';

export const useSocketEvents = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => dispatch(setConnected(true));
    const onDisconnect = () => dispatch(setConnected(false));

    const onGameState = (payload: GameStatePayload) => {
      dispatch(syncRoomState(payload));
    };

    const onPlayerJoined = (payload: PlayerJoinedPayload) => {
      dispatch(playerJoined(payload));
    };

    const onPlayerLeft = (payload: PlayerLeftPayload) => {
      dispatch(playerLeft(payload));
    };

    const onBetsUpdated = (payload: BetsUpdatedPayload) => {
      dispatch(betsUpdated(payload));
    };

    const onDiceRolling = () => {
      dispatch(setRolling());
    };

    const onDiceResult = (payload: DiceResultPayload) => {
      dispatch(diceResult(payload));
    };

    const onError = (payload: ErrorPayload) => {
      dispatch(setError(payload.message));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_state', onGameState);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('bets_updated', onBetsUpdated);
    socket.on('dice_rolling', onDiceRolling);
    socket.on('dice_result', onDiceResult);
    socket.on('error_event', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_state', onGameState);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('bets_updated', onBetsUpdated);
      socket.off('dice_rolling', onDiceRolling);
      socket.off('dice_result', onDiceResult);
      socket.off('error_event', onError);
    };
  }, [dispatch]);
};
