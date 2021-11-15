import classNames from "classnames";
import React, { useState, useCallback, useEffect, useRef } from "react";
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
  selectFocusedTodo,
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

function placeCaretAtEnd(el: HTMLElement) {
  el.focus();
  var range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  var sel = window.getSelection();
  if (sel !== null) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

const TAG_REGEX = /(\s*)(\[[^[]+\])(\s*)/g;

export const TodoRow = ({ todo }: { todo: Todo }) => {
  const dispatch = useAppDispatch();
  const { bullet, text } = todo;
  const divTextRef = useRef<HTMLDivElement>(null);

  const focusedTodoIndex = useSelector(selectFocusedTodo);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: todo.index.toString(), attributes: { tabIndex: -1 } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cs = classNames("row", {
    completed: bullet === "X",
    empty: text.trim() === "",
  });

  const handleBulletClick = useCallback(() => {
    dispatch(updateTodo({ ...todo, bullet: todo.bullet === "X" ? "O" : "X" }));
  }, [todo, dispatch]);

  useEffect(() => {
    if (divTextRef.current) {
      divTextRef.current.innerHTML = text
        .trim()
        .replace(TAG_REGEX, "$1<span class='tag'>$2</span>$3");
    }
  }, [divTextRef, text]);

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
        <ContentEditableText
          spellCheck={false}
          onChange={(newText) =>
            dispatch(updateTodo({ ...todo, text: newText }))
          }
          onEnterPressed={(newText) => {
            dispatch(updateTodo({ ...todo, text: newText }));
            dispatch(addEmptyTodo());
          }}
          onDelete={() => {
            dispatch(deleteTodo(todo.index));
          }}
          enabled
          focus={focusedTodoIndex === todo.index}
        >
          <div ref={divTextRef} className="editable-text">
            {text}
          </div>
        </ContentEditableText>
      </div>
    </div>
  );
};

export const ContentEditableText = ({
  onChange,
  onEnterPressed,
  children,
  enabled,
  spellCheck,
  onDelete,
  focus,
}: {
  onChange: (text: string) => void;
  onEnterPressed: (text: string) => void;
  onDelete: (() => void) | undefined;
  children: JSX.Element;
  enabled: boolean;
  focus: boolean | undefined;
  spellCheck: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // const [innerText, setInnerText] = useState<string>();
  // useEffect(() => {
  //   if (!ref.current) {
  //     return;
  //   }
  //   setInnerText(ref.current.innerText);
  // }, [children, ref]);

  // const handleInput: React.FormEventHandler<HTMLDivElement> = useCallback(
  //   (e) => {
  //     console.error("onInput", e.currentTarget.innerText);
  //   },
  //   [text, onChange]
  // );
  // o

  useEffect(() => {
    if (!ref.current || !focus) {
      return;
    }
    if (!focus) {
      setFocused(false);
      ref.current.blur();
    }
    if (focus && !focused) {
      placeCaretAtEnd(ref.current);
      setFocused(true);
    }
  }, [ref, focus, focused]);

  const handleBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      onChange(e.currentTarget.innerText);
    },
    [onChange]
  );

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      console.error("handleKeyDown", {
        key: e.key,
        tar: e.currentTarget.innerText.trim(),
        ref: ref.current?.innerText.trim(),
      });
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterPressed(e.currentTarget.innerText);
      }
      if (
        onDelete &&
        e.key === "Backspace" &&
        e.currentTarget.innerText.trim() === ""
      ) {
        e.preventDefault();
        onDelete();
      }
      if (e.key === "Enter" || e.key === "Escape") {
        onChange(e.currentTarget.innerText);
        if (ref.current) {
          ref.current.blur();
        }
      }
    },
    [ref, onEnterPressed, onChange, onDelete]
  );

  return (
    <div
      className="content-editable"
      spellCheck={spellCheck}
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
            spellCheck={true}
            onEnterPressed={(newTitle) => {
              dispatch(setTitle(newTitle));
            }}
            onDelete={() => {}}
            onChange={(newTitle) => {
              dispatch(setTitle(newTitle));
            }}
            enabled
            focus={false}
          >
            <div className="text">{title}</div>
          </ContentEditableText>
        </div>
        <DndContext
          onDragEnd={handleOnDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={rows.map((r) => r.index.toString())}>
            {rows.map((row) => (
              <TodoRow key={row.index} todo={row} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
