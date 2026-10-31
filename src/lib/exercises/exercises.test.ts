import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { compile } from "mathjs";
import type { PyodideAPI } from "pyodide";
import { getLessonBySlug } from "@/lib/curriculum";
import { locales } from "@/lib/i18n/config";
import { buildClientExercise, variantCount, variantParams } from "./build";
import { checkConditions, checkNumeric, checkOrder, checkPyValue, checkSymbolic } from "./check";
import { planarArmValues, snapAngle } from "./planarArm";
import { runPythonCases } from "./python";
import { exerciseSets, getExercise, isExerciseVisible } from "./registry";
import { validateSet } from "./schema";
import { nodePyodide } from "./test-pyodide";
import type { ExerciseDef, Params, PythonDef } from "./types";

// Every registered exercise, every variant, both locales: the data is valid,
// the texts render, the reference answer passes the browser's checker (and a
// perturbed one does not), and the reference solution agrees with its
// independent verification. Python exercises also run their reference code
// (which must pass every case) and their starter code (which must not) in
// Pyodide.

const mathjsCompile = (expr: string) => {
  const code = compile(expr);
  return (scope: Record<string, number>) => code.evaluate({ ...scope }) as number;
};

const all: ExerciseDef[] = exerciseSets.flatMap((s) => s.exercises);
const CONTENT = fileURLToPath(new URL("../../../content", import.meta.url));

describe("exercise registry", () => {
  it("registers every exercise data file in content/, each for an existing lesson in its own folder", () => {
    const files = readdirSync(CONTENT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(`${CONTENT}/${d.name}`).filter((f) => f.endsWith(".exercises.ts")).map((f) => ({ area: d.name, slug: f.replace(".exercises.ts", "") })));
    expect(exerciseSets.map((s) => s.lesson).sort()).toEqual(files.map((f) => f.slug).sort());
    for (const { area, slug } of files) expect(getLessonBySlug(slug)?.area, slug).toBe(area);
  });

  it("points every <Exercise id> in the lesson MDX at a registered exercise", () => {
    for (const d of readdirSync(CONTENT, { withFileTypes: true }).filter((x) => x.isDirectory())) {
      for (const f of readdirSync(`${CONTENT}/${d.name}`).filter((x) => x.endsWith(".mdx"))) {
        for (const [, id] of readFileSync(`${CONTENT}/${d.name}/${f}`, "utf8").matchAll(/<Exercise[^>]*\sid="([^"]+)"/g)) {
          expect(getExercise(id), `${d.name}/${f}: ${id}`).toBeDefined();
        }
      }
    }
  });

  it("hides drafts outside the dev server", () => {
    const draft = all.find((e) => e.status === "draft");
    if (draft) {
      expect(isExerciseVisible(draft, false)).toBe(false);
      expect(isExerciseVisible(draft, true)).toBe(true);
    }
  });

  it("rejects malformed exercises with a message naming the exercise", () => {
    const bad = { ...all[0], tolerance: {} } as unknown as ExerciseDef;
    expect(() => validateSet({ lesson: "jacobians", exercises: [bad] })).toThrow(/jacobians.*tolerance/);
  });
});

describe.each(all.map((e) => [e.id, e] as const))("exercise %s", (_, def) => {
  const n = variantCount(def);

  it("renders in every locale and is deterministic", () => {
    for (const locale of locales) {
      const a = buildClientExercise(def, locale);
      const b = buildClientExercise(def, locale);
      expect(a).toEqual(b);
      expect(a.variants).toHaveLength(n);
      for (const v of a.variants) {
        expect(v.statementHtml.length).toBeGreaterThan(0);
        expect(v.solutionHtml.length).toBeGreaterThan(0);
        expect(JSON.stringify(v)).not.toContain("{{");
      }
    }
  });

  it("passes its independent verification in every variant", () => {
    for (let i = 0; i < n; i++) def.verify?.(variantParams(def, i).params as never);
  });

  it("accepts the reference answer, and rejects a wrong one, in every variant", () => {
    const ex = buildClientExercise(def, "en");
    ex.variants.forEach(({ answer }, i) => {
      const where = `${def.id} variant ${i}`;
      switch (answer.kind) {
        case "numeric": {
          expect(checkNumeric(String(answer.value), answer), where).toEqual({ ok: true });
          expect(checkNumeric(answer.value.toFixed(6).replace(".", ","), answer), where).toEqual({ ok: true });
          const off = answer.value === 0 ? 1 : answer.value * 1.2;
          expect(checkNumeric(String(off), answer).ok, where).toBe(false);
          break;
        }
        case "mcq": {
          const correct = answer.options.filter((o) => o.correct);
          expect(correct.length, where).toBeGreaterThanOrEqual(1);
          expect(answer.options.length, where).toBeGreaterThanOrEqual(2);
          expect(new Set(answer.options.map((o) => o.id)).size).toBe(answer.options.length);
          for (const o of answer.options) expect(o.feedbackHtml.length, `${where} ${o.id}`).toBeGreaterThan(0);
          break;
        }
        case "symbolic": {
          if (def.kind !== "symbolic") throw new Error("kind mismatch");
          const reference = def.solve(variantParams(def, i).params as never);
          expect(checkSymbolic(reference, answer, mathjsCompile), `${where}: ${reference}`).toEqual({ ok: true });
          expect(checkSymbolic(`${reference} + 0.1`, answer, mathjsCompile).ok, where).toBe(false);
          break;
        }
        case "order":
          expect(checkOrder(answer.correct, answer.correct).ok, where).toBe(true);
          expect(checkOrder(answer.items.map((x) => x.id), answer.correct).ok, `${where}: shown shuffled`).toBe(false);
          expect([...answer.items.map((x) => x.id)].sort()).toEqual([...answer.correct].sort());
          break;
        case "wrong-step":
          expect(answer.steps.filter((s) => s.id === answer.wrong)).toHaveLength(1);
          break;
        case "gaps": {
          const ids = answer.parts.flatMap((p) => ("gap" in p ? [p.gap] : []));
          expect(ids.sort(), `${where}: template gaps`).toEqual(Object.keys(answer.gaps).sort());
          for (const [id, g] of Object.entries(answer.gaps)) {
            if (g.kind === "numeric") expect(checkNumeric(String(g.value), g), `${where} ${id}`).toEqual({ ok: true });
            else expect(g.correct, `${where} ${id}`).toBeLessThan(g.options.length);
          }
          break;
        }
        case "interactive": {
          const { setup, conditions, reference } = answer;
          const step = setup.step ?? 1;
          const holds = (angles: number[]) => checkConditions(planarArmValues(setup, angles), conditions).ok;
          expect(reference, where).toHaveLength(setup.links.length);
          for (const a of setup.initial) expect(snapAngle(a, step), `${where}: initial angles on the step`).toBe(a);
          expect(holds(reference), `${where}: reference ${reference}`).toBe(true);
          // the controls move in steps: the reference must stay valid when snapped to them
          expect(holds(reference.map((a) => snapAngle(a, step))), `${where}: snapped reference`).toBe(true);
          expect(holds(setup.initial), `${where}: must not start solved`).toBe(false);
          expect(holds(reference.map((a) => a + 15)), `${where}: perturbed reference`).toBe(false);
          break;
        }
        case "python": {
          if (def.kind !== "python") throw new Error("kind mismatch");
          const p = variantParams(def, i).params as never;
          expect(answer.cases.length, where).toBeGreaterThanOrEqual(2);
          for (const c of answer.cases) {
            def.verifyCase(c.args, c.expected, p);
            expect(checkPyValue(c.expected, c.expected, answer.tolerance), where).toBe("ok");
          }
          break;
        }
      }
    });
  });
});

const pythonExercises = all.filter((e): e is PythonDef<Params> => e.kind === "python");

describe.runIf(pythonExercises.length > 0)("Python exercises in Pyodide", () => {
  let py: PyodideAPI;
  beforeAll(async () => {
    py = await nodePyodide();
  }, 120_000);

  it.each(pythonExercises.map((e) => [e.id, e] as const))("%s: the reference passes every case and the starter does not", (_, def) => {
    for (const { answer } of buildClientExercise(def, "en").variants) {
      if (answer.kind !== "python") throw new Error("kind mismatch");
      const args = answer.cases.map((c) => c.args);
      const passes = (code: string) => {
        const r = runPythonCases(py, code, answer.entry, args);
        return r.status === "done" && r.results.every((res, k) => "value" in res && checkPyValue(res.value, answer.cases[k].expected, answer.tolerance) === "ok");
      };
      const ref = runPythonCases(py, answer.reference, answer.entry, args);
      expect(ref.status, `${def.id} reference`).toBe("done");
      expect(passes(answer.reference), `${def.id} reference: ${JSON.stringify(ref)}`).toBe(true);
      expect(passes(answer.starter), `${def.id} starter`).toBe(false);
    }
  });
});
