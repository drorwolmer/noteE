import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import todoReducer, { saveStateToLocalStorage } from "./todoSlice";

export const store = configureStore({
  reducer: {
    todo: todoReducer,
  },
});

store.subscribe(() => {
  saveStateToLocalStorage({
    todo: store.getState().todo,
  });
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
