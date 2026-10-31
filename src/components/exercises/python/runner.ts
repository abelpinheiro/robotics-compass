import { PYODIDE_INDEX_URL, PYTHON_HARNESS, PYTHON_TIME_LIMIT_MS, type PyArg, type PyRunResult } from "@/lib/exercises/python";
import type { FromWorker, ToWorker } from "./protocol";

// Page side of the Python runner: one shared module worker (a static file,
// public/workers/python-worker.mjs, so no bundler turns it into a classic
// worker, which Pyodide does not support), created on the first run, and one
// run at a time. A run that exceeds the time limit (counted from when the
// code starts, not while Python downloads) terminates the worker; the next
// run starts a new one.

export type RunPhase = "loading" | "running";

export type RunOutcome =
  | { kind: "done"; result: PyRunResult; stdout: string }
  | { kind: "timeout" }
  | { kind: "unavailable" };

let worker: Worker | null = null;
let queue: Promise<unknown> = Promise.resolve();
let nextId = 0;

function getWorker(): Worker {
  worker ??= new Worker("/workers/python-worker.mjs", { type: "module" });
  return worker;
}

function discardWorker() {
  worker?.terminate();
  worker = null;
}

function runOnce(code: string, entry: string, cases: PyArg[][], onPhase: (phase: RunPhase) => void): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const w = getWorker();
    const id = ++nextId;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (outcome: RunOutcome) => {
      clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      resolve(outcome);
    };
    const onMessage = ({ data }: MessageEvent<FromWorker>) => {
      if (data.id !== id) return;
      if (data.type === "phase") {
        onPhase(data.phase);
        if (data.phase === "running") {
          timer = setTimeout(() => (discardWorker(), finish({ kind: "timeout" })), PYTHON_TIME_LIMIT_MS);
        }
      } else if (data.type === "done") {
        finish({ kind: "done", result: data.result, stdout: data.stdout });
      } else {
        finish({ kind: "unavailable" });
      }
    };
    const onError = () => (discardWorker(), finish({ kind: "unavailable" }));
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ type: "run", id, code, entry, cases, indexURL: PYODIDE_INDEX_URL, harness: PYTHON_HARNESS } satisfies ToWorker);
  });
}

/** Run the reader's code against the cases in the worker (queued behind any run in progress). */
export function runPython(code: string, entry: string, cases: PyArg[][], onPhase: (phase: RunPhase) => void): Promise<RunOutcome> {
  const run = queue.then(() => runOnce(code, entry, cases, onPhase));
  queue = run.catch(() => undefined);
  return run;
}
