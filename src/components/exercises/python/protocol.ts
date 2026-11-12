import type { PyArg, PyRunResult } from "@/lib/exercises/python";

// Messages between the page (runner.ts) and the Pyodide worker
// (public/workers/python-worker.mjs, plain JavaScript: keep the two in sync).

export type ToWorker = {
  type: "run";
  id: number;
  code: string;
  entry: string;
  cases: PyArg[][];
  /** the pinned Pyodide CDN build and the harness, used by the first run to load Python */
  indexURL: string;
  harness: string;
};

export type FromWorker =
  /** "loading" only while Pyodide and numpy are being downloaded (first run) */
  | { type: "phase"; id: number; phase: "loading" | "running" }
  | { type: "done"; id: number; result: PyRunResult; stdout: string }
  | { type: "unavailable"; id: number; message: string };
