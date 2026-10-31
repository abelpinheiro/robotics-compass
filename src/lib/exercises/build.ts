import type { Locale } from "@/lib/i18n/config";
import { variantRng, type Rng } from "./random";
import { renderInline, renderTex, renderText, renderWithGaps, type Values } from "./text";
import type { ClientAnswer, ClientExercise, ClientVariant, ExerciseDef, Params } from "./types";

// Server side: turn an exercise definition into the data the browser needs.
// Every variant's parameters, shuffles and reference answers are computed here
// from its seed, and every text is rendered to HTML, so the browser receives
// no functions and no reference solution code.

/** Sample points per symbolic exercise variant. */
const SYMBOLIC_POINTS = 6;

export const variantCount = (def: ExerciseDef) => def.variants ?? (def.params ? 6 : 1);

/** Parameters of one variant (the same RNG stream continues into shuffles and samples). */
export function variantParams(def: ExerciseDef, variant: number): { params: Params; rng: Rng } {
  const rng = variantRng(def.id, variant);
  return { params: def.params ? def.params(rng) : {}, rng };
}

/** A shuffle that never returns the original order (for order exercises). */
function shuffleAway<T>(rng: Rng, items: T[]): T[] {
  if (items.length < 2) return items;
  for (;;) {
    const out = rng.shuffle(items);
    if (out.some((x, i) => x !== items[i])) return out;
  }
}

function buildAnswer(def: ExerciseDef, p: Params, rng: Rng, locale: Locale, values: Values): ClientAnswer {
  const inline = (s: string) => renderInline(s, values, locale);
  const block = (s: string) => renderText(s, values, locale);
  switch (def.kind) {
    case "numeric":
      return {
        kind: "numeric",
        value: def.solve(p),
        tolerance: def.tolerance,
        unitHtml: def.unit ? renderTex(def.unit, values, locale) : undefined,
      };
    case "mcq": {
      const options = typeof def.options === "function" ? def.options(p) : def.options;
      const ordered = def.shuffle === false ? options : rng.shuffle(options);
      return {
        kind: "mcq",
        options: ordered.map((o) => ({
          id: o.id,
          html: inline(o.text[locale]),
          feedbackHtml: block(o.feedback[locale]),
          correct: !!o.correct,
        })),
      };
    }
    case "symbolic": {
      const points = Array.from({ length: SYMBOLIC_POINTS }, () =>
        Object.fromEntries(def.variables.map((v) => [v, rng.uniform(...def.domain[v])])),
      );
      return {
        kind: "symbolic",
        variables: def.variables,
        points,
        values: points.map((pt) => def.evaluate(p, pt)),
        tolerance: def.tolerance,
      };
    }
    case "order":
      return {
        kind: "order",
        items: shuffleAway(rng, def.steps).map((s) => ({ id: s.id, html: inline(s.text[locale]) })),
        correct: def.steps.map((s) => s.id),
      };
    case "wrong-step":
      return {
        kind: "wrong-step",
        steps: def.steps.map((s) => ({ id: s.id, html: inline(s.text[locale]), feedbackHtml: block(s.feedback[locale]) })),
        wrong: def.steps.find((s) => s.wrong)!.id,
      };
    case "gaps":
      return {
        kind: "gaps",
        parts: renderWithGaps(def.template[locale], values, locale),
        gaps: Object.fromEntries(
          Object.entries(def.gaps).map(([id, g]) => [
            id,
            g.kind === "numeric"
              ? { kind: "numeric", value: g.solve(p), tolerance: g.tolerance, unitHtml: g.unit ? renderTex(g.unit, values, locale) : undefined }
              : { kind: "choice", options: Array.isArray(g.options) ? g.options : g.options[locale], correct: g.correct },
          ]),
        ),
      };
  }
}

export function buildVariant(def: ExerciseDef, variant: number, locale: Locale): ClientVariant {
  const { params, rng } = variantParams(def, variant);
  const values: Values = { ...params };
  if (def.kind === "numeric") values.answer = def.solve(params);
  if (def.kind === "gaps") {
    // numeric gaps can be quoted in the texts by their id, e.g. {{jx:4}} in the solution
    for (const [id, g] of Object.entries(def.gaps)) {
      if (g.kind !== "numeric") continue;
      if (id in values) throw new Error(`${def.id}: gap "${id}" clashes with a parameter`);
      values[id] = g.solve(params);
    }
  }
  const answer = buildAnswer(def, params, rng, locale, values);
  return {
    statementHtml: renderText(def.statement[locale], values, locale),
    hintsHtml: (def.hints ?? []).map((h) => renderText(h[locale], values, locale)),
    solutionHtml: renderText(def.solution[locale], values, locale),
    answer,
  };
}

export function buildClientExercise(def: ExerciseDef, locale: Locale): ClientExercise {
  return {
    id: def.id,
    level: def.level,
    draft: def.status === "draft",
    variants: Array.from({ length: variantCount(def) }, (_, i) => buildVariant(def, i, locale)),
  };
}
