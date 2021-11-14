import classNames from "classnames";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useSortable, SortableContext, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { useSelector } from "react-redux";
import "./App.css";
import { useAppDispatch } from "./app/hooks";
import {
  addEmptyTodo,
  deleteTodo,
  loadFromLocalStorage,
  selectTitle,
  selectTodos,
  setTitle,
  updateTodo,
  updateTodos,
} from "./app/todoSlice";

export type Todo = {
  bullet: "X" | "O";
  text: string;
  index: number;
};

const TAG_REGEX = /(\s*)(\[[^[]+\])(\s*)/g;

export const TodoRow = ({
  todo,
  selected,
  onSelect,
  onBlur,
  onEnterPress,
  position,
}: {
  todo: Todo;
  selected: boolean;
  onSelect: () => void;
  onBlur: () => void;
  onEnterPress: () => void;
  position: number;
}) => {
  const dispatch = useAppDispatch();
  const { bullet, text } = todo;
  const divTextRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: todo.index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [autoFocused, setAutoFocused] = useState(false);
  useEffect(() => {
    if (
      divTextRef.current &&
      !autoFocused &&
      position === 0 &&
      text.trim() === ""
    ) {
      console.error("AUTO FOCUS?");
      setAutoFocused(true);
    }
  }, [position, text, autoFocused, divTextRef]);

  const cs = classNames("row", {
    completed: bullet === "X",
    selected,
    empty: text.trim() === "",
  });

  const handleContentEditableBlur: React.FocusEventHandler<HTMLDivElement> =
    useCallback(
      (e) => {
        if (divTextRef.current && todo.text !== e.currentTarget.innerText) {
          dispatch(updateTodo({ ...todo, text: e.currentTarget.innerText }));
        }
        onBlur();
      },
      [divTextRef, dispatch, onBlur, todo]
    );

  const handleBulletClick = useCallback(() => {
    dispatch(updateTodo({ ...todo, bullet: todo.bullet === "X" ? "O" : "X" }));
    onBlur();
  }, [todo, dispatch, onBlur]);

  useEffect(() => {
    if (selected && divTextRef.current) {
      divTextRef.current.focus();
    }
    if (!selected && divTextRef.current) {
      divTextRef.current.blur();
    }
  }, [selected, divTextRef, text]);

  useEffect(() => {
    if (divTextRef.current) {
      divTextRef.current.innerHTML = text
        .toString()
        .replace(TAG_REGEX, "$1<span class='tag'>$2</span>$3");
    }
  }, [divTextRef, text]);

  const handleKeyUp: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    console.error("KEY UP", { key: e.key, t: e.currentTarget.innerText });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.currentTarget.innerText.trim() !== "") {
          dispatch(updateTodo({ ...todo, text: e.currentTarget.innerText }));
        }
        onBlur();
        onEnterPress();
        e.currentTarget.blur();
      }
      if (e.key === "Backspace" && e.currentTarget.innerText === "") {
        dispatch(deleteTodo(todo.index));
      }
      if (e.key === "Escape") {
        onBlur();
      }
      console.error("KEY DOWN", { key: e.key, t: e.currentTarget.innerText });
    },
    [dispatch, onBlur, todo, onEnterPress]
  );

  return (
    <div className={cs} ref={setNodeRef} style={style}>
      <div className="left-gutter" {...attributes} {...listeners}>
        <div className="hole2"></div>
        <div className="hole"></div>
      </div>
      <div onClick={handleBulletClick} className="bullet">
        <span className="hover">X</span>
        <span className="circle">O</span>
      </div>
      <div className="text">
        {/* {bullet === "X" && <span className="line-through" />} */}
        <div
          ref={divTextRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onKeyDown={handleKeyDown}
          onBlur={handleContentEditableBlur}
          spellCheck={false}
          onKeyUp={handleKeyUp}
          className="editable-text"
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export const ContentEditableText = ({
  text,
  onChange,
  onEnter,
  children,
  enabled,
}: {
  text: string;
  onChange: (text: string) => void;
  onEnter: (text: string) => void;
  children: JSX.Element;
  enabled: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // const handleInput: React.FormEventHandler<HTMLDivElement> = useCallback(
  //   (e) => {
  //     console.error("onInput", e.currentTarget.innerText);
  //   },
  //   [text, onChange]
  // );

  const handleBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onChange(e.currentTarget.innerText);
    },
    [onChange]
  );

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      console.error("handleKeyDown", e.key, e.currentTarget.innerText);
      if (e.key === "Enter") {
        e.preventDefault();
        onEnter(e.currentTarget.innerText);
      }
      if (e.key === "Enter" || e.key === "Escape") {
        onChange(e.currentTarget.innerText);
        if (ref.current) {
          ref.current.blur();
        }
      }
    },
    [ref, onEnter, onChange]
  );

  return (
    <div
      className="content-editable"
      ref={ref}
      contentEditable={enabled}
      suppressContentEditableWarning={true}
      // onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      {children}
    </div>
  );
};

function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(loadFromLocalStorage());
  }, [dispatch]);

  const rows = useSelector(selectTodos);
  const title = useSelector(selectTitle);
  const [currentEditingRow, setCurrentEditingRow] = useState<number>();

  const handleEnterPress = useCallback(() => {
    dispatch(addEmptyTodo());
  }, [dispatch]);

  const handleOnDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (e.over === null) {
        return;
      }
      const oldIndex = rows.findIndex(
        (r) => r.index.toString() === e.active.id
      );
      const newIndex = rows.findIndex((r) => r.index.toString() === e.over?.id);
      console.error(e.active.id, e.over?.id, oldIndex, newIndex);
      dispatch(updateTodos(arrayMove(rows, oldIndex, newIndex)));
    },
    [dispatch, rows]
  );

  return (
    <div className="App">
      <div className="rows">
        <div className="row upper-gutter">
          <div className="left-gutter"></div>
          <ContentEditableText
            text={title}
            onEnter={(newTitle) => {
              dispatch(setTitle(newTitle));
            }}
            onChange={(newTitle) => {
              dispatch(setTitle(newTitle));
            }}
            enabled
          >
            <div className="text">{title}</div>
          </ContentEditableText>
        </div>
        <DndContext
          onDragEnd={handleOnDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={rows.map((r) => r.index.toString())}>
            {rows.map((row, position) => (
              <TodoRow
                key={row.index}
                todo={row}
                onSelect={() => setCurrentEditingRow(row.index)}
                selected={row.index === currentEditingRow}
                onBlur={() => setCurrentEditingRow(undefined)}
                onEnterPress={handleEnterPress}
                position={position}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
