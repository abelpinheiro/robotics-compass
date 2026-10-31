import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import type { PyodideAPI } from "pyodide";
import { PYODIDE_INDEX_URL, PYODIDE_VERSION, pyCall, pyRepr, runPythonCases } from "./python";
import { nodePyodide } from "./test-pyodide";

// The harness that runs a reader's Python, executed in a real Pyodide (the
// same version the browser loads from the CDN).

describe("Pyodide version", () => {
  it("loads the CDN build of the same version as the npm package used by the tests", () => {
    const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../../../node_modules/pyodide/package.json", import.meta.url)), "utf8"));
    expect(pkg.version).toBe(PYODIDE_VERSION);
    expect(PYODIDE_INDEX_URL).toBe(`https://cdn.jsdelivr.net/pyodide/v${pkg.version}/full/`);
  });
});

describe("pyRepr / pyCall", () => {
  it("writes values and calls as Python source", () => {
    expect(pyRepr(0.5)).toBe("0.5");
    expect(pyRepr(-0)).toBe("0");
    expect(pyRepr(Math.PI)).toBe("3.14159");
    expect(pyRepr(Math.cos(Math.PI / 2))).toBe("0");
    expect(pyRepr([[1, 0], [0, null]])).toBe("[[1, 0], [0, nan]]");
    expect(pyCall("f", [0.3, [1, 2]])).toBe("f(0.3, [1, 2])");
  });
});

describe("Python harness", () => {
  let py: PyodideAPI;
  beforeAll(async () => {
    py = await nodePyodide();
  }, 120_000);

  const run = (code: string, cases: number[][], entry = "f") => runPythonCases(py, code, entry, cases);

  it("calls the function once per case and returns floats, arrays as nested lists", () => {
    const code = "import numpy as np\ndef f(a, b):\n    return np.array([[a, b], [b, a]])";
    expect(run(code, [[1, 2], [0.5, -1]])).toEqual({
      status: "done",
      results: [{ value: [[1, 2], [2, 1]] }, { value: [[0.5, -1], [-1, 0.5]] }],
    });
    expect(run("def f(x):\n    return [x, 2 * x]", [[3]])).toEqual({ status: "done", results: [{ value: [3, 6] }] });
    expect(run("def f(x):\n    return x / 2", [[3]])).toEqual({ status: "done", results: [{ value: 1.5 }] });
  });

  it("turns nan, inf and a missing return (None) into null", () => {
    const r = run("import math\ndef f(x):\n    if x > 0:\n        return [math.nan, math.inf]", [[1], [-1]]);
    expect(r).toEqual({ status: "done", results: [{ value: [null, null] }, { value: null }] });
  });

  it("reports a syntax error with its line", () => {
    const r = run("def f(x):\n    return x +\n", [[1]]);
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(r.error.type).toBe("SyntaxError");
      expect(r.error.line).toBe(2);
      expect(r.error.message).not.toContain("line");
    }
  });

  it("reports an exception raised by one case with its line, and keeps running the others", () => {
    const r = run("def f(x):\n    y = 1 / x\n    return y", [[0], [2]]);
    expect(r.status).toBe("done");
    if (r.status === "done") {
      expect(r.results[0]).toEqual({ error: { type: "ZeroDivisionError", message: "division by zero", line: 2 } });
      expect(r.results[1]).toEqual({ value: 0.5 });
    }
  });

  it("reports a missing function, and a ragged return value as an error", () => {
    expect(run("def g(x):\n    return x", [[1]])).toEqual({ status: "missing", entry: "f" });
    const r = run("def f(x):\n    return [[1, 2], [3]]", [[1]]);
    expect(r.status === "done" && "error" in r.results[0] && r.results[0].error.type).toBe("ValueError");
  });

  it("runs each submission in a fresh namespace", () => {
    run("secret = 42\ndef f(x):\n    return x", [[1]]);
    const r = run("def f(x):\n    return secret", [[1]]);
    expect(r.status === "done" && "error" in r.results[0] && r.results[0].error.type).toBe("NameError");
  });
});
