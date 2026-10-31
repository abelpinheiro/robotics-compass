// Module Web Worker that runs readers' Python in exercises; created by
// src/components/exercises/python/runner.ts. It is a static file on purpose:
// bundlers may emit workers as classic scripts, and Pyodide runs only in
// module workers. Each run message carries the pinned Pyodide CDN URL and the
// harness from src/lib/exercises/python.ts, so the version lives in one place.
// Message shapes: src/components/exercises/python/protocol.ts.

const MAX_OUTPUT_LINES = 200;

let pyodide = null;
let loaded = false;
let output = [];

async function load(indexURL, harness) {
  const { loadPyodide } = await import(`${indexURL}pyodide.mjs`);
  const py = await loadPyodide({ indexURL });
  await py.loadPackage("numpy", { messageCallback: () => {} });
  py.runPython(harness);
  const collect = (line) => {
    if (output.length < MAX_OUTPUT_LINES) output.push(line);
  };
  py.setStdout({ batched: collect });
  py.setStderr({ batched: collect });
  loaded = true;
  return py;
}

self.addEventListener("message", async ({ data }) => {
  const { id, code, entry, cases, indexURL, harness } = data;
  if (!loaded) self.postMessage({ type: "phase", id, phase: "loading" });
  let py;
  try {
    py = await (pyodide ??= load(indexURL, harness));
  } catch (error) {
    pyodide = null;
    self.postMessage({ type: "unavailable", id, message: String(error) });
    return;
  }
  self.postMessage({ type: "phase", id, phase: "running" });
  output = [];
  let result;
  try {
    // the same call as runPythonCases in src/lib/exercises/python.ts
    const run = py.runPython("_rc_run");
    result = JSON.parse(run(code, entry, JSON.stringify(cases)));
    run.destroy();
  } catch (error) {
    // the harness catches Python exceptions; this is Pyodide itself failing
    // (e.g. out of memory), so start from a fresh interpreter next time
    pyodide = null;
    loaded = false;
    result = { status: "error", error: { type: "Error", message: String(error), line: null } };
  }
  self.postMessage({ type: "done", id, result, stdout: output.join("\n") });
});
