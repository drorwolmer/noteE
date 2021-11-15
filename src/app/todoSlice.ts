import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import moment from "moment";
import { RootState, AppThunk } from "./store";

export type Todo = {
  bullet: "X" | "O";
  text: string;
  index: number;
};

export interface TodoState {
  title: string;
  initialized: boolean;
  todos: Todo[];
  focusedTodo: number | undefined;
}

const initialState: TodoState = {
  title: "",
  todos: [],
  initialized: false,
  focusedTodo: undefined,
};

export const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    updateTodos: (state, action: PayloadAction<Todo[]>) => {
      state.todos = action.payload;
    },
    updateTodo: (state, action: PayloadAction<Todo>) => {
      const todo = action.payload;
      state.todos = state.todos.map((t) => (t.index === todo.index ? todo : t));
    },
    deleteTodo: (state, action: PayloadAction<number>) => {
      state.todos = state.todos.filter((t) => t.index !== action.payload);
    },
    addEmptyTodo: (state) => {
      const newTodo: Todo = {
        bullet: "O",
        text: " ",
        index: new Date().getTime(),
      };
      state.todos.push(newTodo);
      state.focusedTodo = newTodo.index;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
});
export const {
  updateTodo,
  updateTodos,
  setTitle,
  addEmptyTodo,
  deleteTodo,
  setInitialized,
} = todoSlice.actions;

export const loadFromLocalStorage = (): AppThunk => async (dispatch) => {
  const foo = localStorage.getItem("data");
  if (foo) {
    dispatch(updateTodos(JSON.parse(foo) as Todo[]));
  } else {
    dispatch(
      updateTodos([
        {
          bullet: "O",
          text: "A very important Task [IMPORTANT]",
          index: new Date().getTime() + 1,
        },
        {
          bullet: "X",
          text: "Look at the new noteE app",
          index: new Date().getTime() + 2,
        },
        {
          bullet: "O",
          text: "Listen more to haminet.fm",
          index: new Date().getTime() + 3,
        },
        {
          bullet: "O",
          text: " ",
          index: new Date().getTime() + 5,
        },
        {
          bullet: "O",
          text: " ",
          index: new Date().getTime() + 6,
        },
        {
          bullet: "O",
          text: " ",
          index: new Date().getTime() + 7,
        },
        {
          bullet: "O",
          text: " ",
          index: new Date().getTime() + 8,
        },
      ])
    );
  }
  const defaultTitle = `TODO ${moment().format("YYYY/MM/DD")}`;
  dispatch(setTitle(localStorage.getItem("title") || defaultTitle));
  dispatch(setInitialized(true));
};

export const saveStateToLocalStorage = (state: RootState) => {
  if (state.todo.initialized) {
    localStorage.setItem("data", JSON.stringify(state.todo.todos));
    localStorage.setItem("title", state.todo.title);
  }
};

export const selectTodos = (state: RootState) => state.todo.todos;
export const selectTitle = (state: RootState) => state.todo.title;
export const selectFocusedTodo = (state: RootState) => state.todo.focusedTodo;

export default todoSlice.reducer;
