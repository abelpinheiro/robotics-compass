"use client";

import { useState } from "react";
import { checkPyValue, type PyValue } from "@/lib/exercises/check";
import { PYTHON_TIME_LIMIT_MS, pyCall, pyRepr, type PyError } from "@/lib/exercises/python";
import type { ClientAnswer } from "@/lib/exercises/types";
import type { ExerciseStrings } from "../strings";
import { primaryButton, Result, secondaryButton, type Feedback } from "../ui";
import { PythonEditor } from "./PythonEditor";
import { runPython, type RunPhase } from "./runner";

// Answer area of a Python exercise (loaded lazily by ExerciseRunner): the
// reader writes the function, it runs in a Pyodide worker against the
// variant's cases, and each returned value is compared with the expected one
// (computed on the server by the TypeScript reference).

type Answer = Extract<ClientAnswer, { kind: "python" }>;

interface CaseRow {
  call: string;
  status: "ok" | "shape" | "wrong" | "error";
  expected: string;
  got: string;
}

/** Python repr with one matrix row per line. */
function pretty(v: PyValue): string {
  if (Array.isArray(v) && v.length > 1 && v.every(Array.isArray)) return `[${v.map(pyRepr).join(",\n ")}]`;
  return pyRepr(v);
}

const errorText = (e: PyError, s: ExerciseStrings) => `${e.type}${e.line ? ` (${s.line(e.line)})` : ""}: ${e.message}`;

export default function PythonAnswer({ answer, s }: { answer: Answer; s: ExerciseStrings }) {
  const [code, setCode] = useState(answer.starter);
  const [phase, setPhase] = useState<RunPhase | null>(null);
  const [rows, setRows] = useState<CaseRow[] | null>(null);
  const [stdout, setStdout] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  const run = async () => {
    if (phase) return;
    setFeedback(null);
    setPhase("running");
    const outcome = await runPython(code, answer.entry, answer.cases.map((c) => c.args), setPhase);
    setPhase(null);
    if (outcome.kind !== "done") {
      setRows(null);
      setStdout("");
      setFeedback({ ok: false, message: outcome.kind === "timeout" ? s.timeLimit(PYTHON_TIME_LIMIT_MS / 1000) : s.pythonUnavailable });
      return;
    }
    const { result } = outcome;
    setStdout(outcome.stdout);
    if (result.status !== "done") {
      setRows(null);
      setFeedback({ ok: false, message: result.status === "missing" ? s.missingFunction(result.entry) : `${s.codeError} ${errorText(result.error, s)}` });
      return;
    }
    const next = answer.cases.map((c, k): CaseRow => {
      const r = result.results[k];
      const call = pyCall(answer.entry, c.args);
      if ("error" in r) return { call, status: "error", expected: pretty(c.expected), got: errorText(r.error, s) };
      return { call, status: checkPyValue(r.value, c.expected, answer.tolerance), expected: pretty(c.expected), got: pretty(r.value) };
    });
    const passed = next.filter((r) => r.status === "ok").length;
    setRows(next);
    setFeedback(passed === next.length ? { ok: true, message: s.correct } : { ok: false, message: `${s.casesPassed(passed, next.length)} ${s.incorrect}` });
  };

  return (
    <>
      <PythonEditor value={code} onChange={setCode} onRun={() => void run()} s={s} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={primaryButton} onClick={() => void run()} disabled={phase !== null}>
          {s.runCode}
        </button>
        <button type="button" className={secondaryButton} onClick={() => setCode(answer.starter)} disabled={phase !== null}>
          {s.resetCode}
        </button>
        <span role="status" aria-live="polite" className="text-sm text-muted">
          {phase === "loading" ? s.loadingPython : phase === "running" ? s.running : ""}
        </span>
      </div>
      <Result feedback={feedback} />
      {stdout && (
        <div className="mt-3">
          <p className="!my-0 text-sm font-medium text-muted">{s.output}</p>
          <pre className="!mt-1 !mb-0 max-h-48 overflow-auto rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
            {stdout}
          </pre>
        </div>
      )}
      {rows && (
        <div className="mt-3">
          <p className="!my-0 text-sm font-medium text-muted">{s.testCases}</p>
          <ul className="!mt-1 !mb-0 list-none space-y-1.5 !pl-0">
            {rows.map((r, i) => (
              <li key={i} className={`!my-0 rounded-lg border-l-4 bg-surface px-3 py-2 ${r.status === "ok" ? "border-success" : "border-danger"}`}>
                <p className="!my-0 overflow-x-auto font-mono text-sm whitespace-pre text-foreground">
                  <span aria-hidden="true">{r.status === "ok" ? "✓ " : "✗ "}</span>
                  <span className="sr-only">{r.status === "ok" ? s.correct : s.incorrect} </span>
                  {r.call}
                  {r.status === "shape" && <span className="font-sans text-muted"> · {s.wrongShape}</span>}
                </p>
                {r.status !== "ok" && (
                  <dl className="!mt-1 !mb-0 grid grid-cols-[auto_1fr] gap-x-3 text-sm">
                    <dt className="text-muted">{s.expected}</dt>
                    <dd className="!m-0 overflow-x-auto font-mono whitespace-pre text-foreground">{r.expected}</dd>
                    <dt className="text-muted">{s.got}</dt>
                    <dd className="!m-0 overflow-x-auto font-mono whitespace-pre text-foreground">{r.got}</dd>
                  </dl>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
