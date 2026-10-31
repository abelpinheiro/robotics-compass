import type { PyValue } from "./check";

// Python exercises: the parts shared by the browser, where a module Web Worker
// (public/workers/python-worker.mjs, driven by components/exercises/python)
// runs Pyodide loaded from its CDN, and the tests, which run the same harness
// with Pyodide from the npm package in Node.

/** Pinned to the `pyodide` npm package; python.test.ts checks that they match. */
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
/** Run time limit of the reader's code (loading Python does not count). */
export const PYTHON_TIME_LIMIT_MS = 10_000;

/** An argument passed to the reader's function: a number or nested lists of them. */
export type PyArg = number | PyArg[];

export interface PyError {
  /** exception class, e.g. "SyntaxError" */
  type: string;
  message: string;
  /** line in the reader's code, when the error points there */
  line: number | null;
}

export type PyRunResult =
  /** the code did not run at all (e.g. a SyntaxError at the top level) */
  | { status: "error"; error: PyError }
  /** the code ran but defines no function with the expected name */
  | { status: "missing"; entry: string }
  /** one result per case: the returned value (as floats) or the exception it raised */
  | { status: "done"; results: ({ value: PyValue } | { error: PyError })[] };

/**
 * Python run once when Pyodide starts. `_rc_run(code, entry, cases_json)`
 * executes the reader's code in a fresh namespace, calls `entry(*args)` for
 * each case, and returns a JSON PyRunResult. Returned values go through
 * `np.asarray(…, dtype=float)`, so lists and arrays compare the same way;
 * nan/inf become null (JSON has no NaN).
 */
export const PYTHON_HARNESS = `
import json, math, traceback
import numpy as np

def _rc_clean(v):
    if isinstance(v, list):
        return [_rc_clean(x) for x in v]
    return v if math.isfinite(v) else None

def _rc_error(e):
    line = None
    if isinstance(e, SyntaxError) and e.filename == "<exercise>":
        line = e.lineno
    for frame in traceback.extract_tb(e.__traceback__):
        if frame.filename == "<exercise>":
            line = frame.lineno
    message = e.msg if isinstance(e, SyntaxError) else str(e)
    return {"type": type(e).__name__, "message": message, "line": line}

def _rc_run(code, entry, cases_json):
    ns = {"__name__": "__exercise__"}
    try:
        exec(compile(code, "<exercise>", "exec"), ns)
    except BaseException as e:
        return json.dumps({"status": "error", "error": _rc_error(e)})
    fn = ns.get(entry)
    if not callable(fn):
        return json.dumps({"status": "missing", "entry": entry})
    results = []
    for args in json.loads(cases_json):
        try:
            value = np.asarray(fn(*args), dtype=float)
            results.append({"value": _rc_clean(value.tolist())})
        except BaseException as e:
            results.append({"error": _rc_error(e)})
    return json.dumps({"status": "done", "results": results})
`;

/** The part of a Pyodide instance the runner needs (browser worker or Node). */
export interface PyodideLike {
  runPython(code: string): unknown;
}

/**
 * Run the reader's code against the cases, in a Pyodide that already ran
 * PYTHON_HARNESS. The browser worker makes the same call in plain JavaScript.
 */
export function runPythonCases(py: PyodideLike, code: string, entry: string, cases: PyArg[][]): PyRunResult {
  const run = py.runPython("_rc_run") as (code: string, entry: string, casesJson: string) => string;
  return JSON.parse(run(code, entry, JSON.stringify(cases))) as PyRunResult;
}

/** A number as a short Python literal (6 significant digits; rounding noise below 1e-10 shows as 0). */
function pyNumber(v: number): string {
  if (Math.abs(v) < 1e-10) return "0";
  return String(Number(v.toPrecision(6)));
}

/** A value as Python source: 0.5, [1, 0], [[1, 0], [0, 1]]; null as nan. */
export function pyRepr(v: PyValue): string {
  if (v === null) return "nan";
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(", ")}]`;
  return pyNumber(v);
}

/** A call as Python source, for showing a test case: link_transform(0.5, 0, 1.2, 0.1). */
export function pyCall(entry: string, args: PyArg[]): string {
  return `${entry}(${args.map(pyRepr).join(", ")})`;
}
