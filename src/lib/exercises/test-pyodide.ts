// Test-only: one Pyodide per test file, from the npm package, with numpy and
// the exercise harness loaded. The first run downloads the numpy wheel from
// the Pyodide CDN into node_modules/pyodide; later runs use that copy.

import { loadPyodide, type PyodideAPI } from "pyodide";
import { PYTHON_HARNESS } from "./python";

let pyodide: Promise<PyodideAPI> | null = null;

export function nodePyodide(): Promise<PyodideAPI> {
  pyodide ??= (async () => {
    const py = await loadPyodide();
    await py.loadPackage("numpy", { messageCallback: () => {} });
    py.runPython(PYTHON_HARNESS);
    return py;
  })();
  return pyodide;
}
