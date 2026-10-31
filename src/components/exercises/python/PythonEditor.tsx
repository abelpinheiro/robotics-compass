"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { ExerciseStrings } from "../strings";

// A plain textarea for short Python functions: monospace, Tab indents by four
// spaces, Enter keeps the indentation (one level more after a ":"), and
// Ctrl/Cmd+Enter runs. Esc releases Tab, so the next Tab leaves the editor
// (no keyboard trap); typing or refocusing captures it again.

const INDENT = "    ";

export function PythonEditor({
  value,
  onChange,
  onRun,
  s,
}: {
  value: string;
  onChange: (code: string) => void;
  onRun: () => void;
  s: ExerciseStrings;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [captureTab, setCaptureTab] = useState(true);

  /** Insert text at the caret, keeping the browser's undo history when it can. */
  const insert = (text: string) => {
    const el = ref.current;
    if (!el) return;
    if (!document.execCommand?.("insertText", false, text)) {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
      onChange(el.value);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "Escape") {
      setCaptureTab(false);
      return;
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
      return;
    }
    const lineStart = el.value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    if (e.key === "Tab" && captureTab && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!e.shiftKey) return insert(INDENT);
      const spaces = el.value.slice(lineStart).match(/^ {1,4}/)?.[0].length ?? 0;
      if (spaces > 0) {
        el.setRangeText("", lineStart, lineStart + spaces, "preserve");
        onChange(el.value);
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && el.selectionStart === el.selectionEnd) {
      const before = el.value.slice(lineStart, el.selectionStart);
      const indent = before.match(/^ */)![0] + (before.trimEnd().endsWith(":") ? INDENT : "");
      e.preventDefault();
      insert(`\n${indent}`);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-muted">
        {s.codeLabel}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => (onChange(e.target.value), setCaptureTab(true))}
        onFocus={() => setCaptureTab(true)}
        onKeyDown={onKeyDown}
        rows={Math.max(8, value.split("\n").length + 1)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
        aria-describedby={`${id}-help`}
        className="block w-full resize-y overflow-x-auto rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm leading-6 text-foreground focus:border-accent"
      />
      <p id={`${id}-help`} className="!mt-1 !mb-0 text-xs text-muted">
        {s.editorHelp}
      </p>
    </div>
  );
}
