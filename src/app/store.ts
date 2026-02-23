import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../features/game/gameSlice';
import multiplayerReducer from '../features/game/multiplayerSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    multiplayer: multiplayerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
