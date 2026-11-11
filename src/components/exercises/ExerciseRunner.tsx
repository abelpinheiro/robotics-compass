"use client";

import { useId, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { checkNumeric, checkOrder, checkSymbolic, type Evaluator } from "@/lib/exercises/check";
import type { ClientAnswer, ClientExercise } from "@/lib/exercises/types";
import { ExerciseCard } from "@/components/lesson/ExerciseCard";
import { exerciseStrings, type ExerciseStrings } from "./strings";

// The interactive side of an exercise. It receives only rendered HTML and
// answer data built on the server (lib/exercises/build.ts), and checks the
// reader's answer with the shared pure checkers (lib/exercises/check.ts).
// mathjs is loaded only when a symbolic answer is checked.

type Feedback = { ok: boolean; message: string; detailHtml?: string } | null;

const Html = ({ html, inline = false }: { html: string; inline?: boolean }) =>
  inline ? <span dangerouslySetInnerHTML={{ __html: html }} /> : <div dangerouslySetInnerHTML={{ __html: html }} />;

const input =
  "rounded-md border border-border bg-background px-2.5 py-1.5 text-[0.9375rem] text-foreground focus:border-accent";
const primary =
  "rounded-md border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50";

function Result({ feedback }: { feedback: Feedback }) {
  return (
    <div role="status" aria-live="polite">
      {feedback && (
        <div
          className={`mt-3 rounded-lg border-l-4 bg-surface px-3 py-2 text-[0.9375rem] text-foreground ${
            feedback.ok ? "border-success" : "border-danger"
          }`}
        >
          <p className="!my-0 font-semibold">
            <span aria-hidden="true">{feedback.ok ? "✓ " : "✗ "}</span>
            {feedback.message}
          </p>
          {feedback.detailHtml && <Html html={feedback.detailHtml} />}
        </div>
      )}
    </div>
  );
}

let mathjsCompile: Promise<(expression: string) => Evaluator> | null = null;
function loadCompiler() {
  mathjsCompile ??= import("mathjs").then(({ compile }) => (expression: string) => {
    const code = compile(expression);
    return (scope: Record<string, number>) => code.evaluate({ ...scope }) as number;
  });
  return mathjsCompile;
}

function NumericAnswer({ answer, s }: { answer: Extract<ClientAnswer, { kind: "numeric" }>; s: ExerciseStrings }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const check = () => {
    const r = checkNumeric(value, answer);
    setFeedback(r.ok ? { ok: true, message: s.correct } : { ok: false, message: r.reason === "invalid" ? s.invalidNumber : s.incorrect });
  };
  return (
    <>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => (e.preventDefault(), check())}>
        <label htmlFor={id} className="sr-only">
          {s.yourAnswer}
        </label>
        <input id={id} inputMode="decimal" autoComplete="off" className={`${input} w-40`} value={value} onChange={(e) => setValue(e.target.value)} />
        {answer.unitHtml && <Html inline html={answer.unitHtml} />}
        <button type="submit" className={primary}>
          {s.check}
        </button>
      </form>
      <Result feedback={feedback} />
    </>
  );
}

function SymbolicAnswer({ answer, s }: { answer: Extract<ClientAnswer, { kind: "symbolic" }>; s: ExerciseStrings }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const check = async () => {
    setBusy(true);
    const r = checkSymbolic(value, answer, await loadCompiler());
    setBusy(false);
    setFeedback(
      r.ok
        ? { ok: true, message: s.correct }
        : { ok: false, message: r.reason === "invalid" ? s.invalidExpression(answer.variables) : s.incorrect },
    );
  };
  return (
    <>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => (e.preventDefault(), void check())}>
        <label htmlFor={id} className="sr-only">
          {s.expression}
        </label>
        <input
          id={id}
          autoComplete="off"
          spellCheck={false}
          className={`${input} min-w-0 flex-1 font-mono text-sm`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={`${id}-vars`}
        />
        <button type="submit" className={primary} disabled={busy}>
          {busy ? s.loading : s.check}
        </button>
      </form>
      <p id={`${id}-vars`} className="!mt-1 !mb-0 text-xs text-muted">
        {s.variables(answer.variables)}
      </p>
      <Result feedback={feedback} />
    </>
  );
}

/** A radio list of rendered options; on check, shows the chosen option's feedback. */
function ChoiceList({
  legend,
  options,
  isCorrect,
  s,
}: {
  legend: string;
  options: { id: string; html: string; feedbackHtml: string }[];
  isCorrect: (id: string) => boolean;
  s: ExerciseStrings;
}) {
  const name = useId();
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const check = () => {
    const option = options.find((o) => o.id === chosen);
    if (!option) return;
    const ok = isCorrect(option.id);
    setFeedback({ ok, message: ok ? s.correct : s.incorrect, detailHtml: option.feedbackHtml });
  };
  return (
    <form onSubmit={(e) => (e.preventDefault(), check())}>
      <fieldset className="!m-0 border-0 !p-0">
        <legend className="mb-2 text-sm font-medium text-muted">{legend}</legend>
        <div className="space-y-1.5">
          {options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 ${
                chosen === o.id ? "border-accent bg-accent-weak" : "border-border hover:bg-surface"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.id}
                checked={chosen === o.id}
                onChange={() => (setChosen(o.id), setFeedback(null))}
                className="mt-1.5 accent-[var(--accent)]"
              />
              <Html html={o.html} inline />
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className={`${primary} mt-3`} disabled={chosen === null}>
        {s.check}
      </button>
      <Result feedback={feedback} />
    </form>
  );
}

function OrderAnswer({ answer, s }: { answer: Extract<ClientAnswer, { kind: "order" }>; s: ExerciseStrings }) {
  const [items, setItems] = useState(answer.items);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setItems(next);
    setFeedback(null);
  };
  const check = () => {
    const r = checkOrder(items.map((x) => x.id), answer.correct);
    setFeedback(r.ok ? { ok: true, message: s.correct } : { ok: false, message: `${s.inPlace(r.inPlace, answer.correct.length)} ${s.incorrect}` });
  };
  const arrow = "rounded border border-border px-1.5 text-sm leading-6 text-muted hover:bg-surface-2 disabled:opacity-30";
  return (
    <>
      <ol className="!my-0 list-none space-y-1.5 !pl-0">
        {items.map((item, i) => (
          <li key={item.id} className="!my-0 flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <span className="w-5 shrink-0 text-sm font-semibold text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1 overflow-x-auto">
              <Html html={item.html} />
            </div>
            <span className="flex shrink-0 flex-col gap-1">
              <button type="button" className={arrow} disabled={i === 0} onClick={() => move(i, -1)} aria-label={s.moveUp(i + 1)}>
                ↑
              </button>
              <button type="button" className={arrow} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label={s.moveDown(i + 1)}>
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <button type="button" className={`${primary} mt-3`} onClick={check}>
        {s.check}
      </button>
      <Result feedback={feedback} />
    </>
  );
}

function GapsAnswer({ answer, s }: { answer: Extract<ClientAnswer, { kind: "gaps" }>; s: ExerciseStrings }) {
  const ids = answer.parts.flatMap((p) => ("gap" in p ? [p.gap] : []));
  const [values, setValues] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const set = (id: string, v: string) => (setValues({ ...values, [id]: v }), setFeedback(null), setMarks({}));
  const check = () => {
    const next: Record<string, boolean> = {};
    for (const id of ids) {
      const g = answer.gaps[id];
      const v = values[id] ?? "";
      next[id] = g.kind === "numeric" ? checkNumeric(v, g).ok : v !== "" && Number(v) === g.correct;
    }
    const right = Object.values(next).filter(Boolean).length;
    setMarks(next);
    setFeedback(right === ids.length ? { ok: true, message: s.correct } : { ok: false, message: `${s.gapsWrong(right, ids.length)} ${s.incorrect}` });
  };
  return (
    <form onSubmit={(e) => (e.preventDefault(), check())}>
      <p className="!my-0 leading-9">
        {answer.parts.map((p, i) => {
          if (!("gap" in p)) return <Html key={i} inline html={p.html} />;
          const g = answer.gaps[p.gap];
          const n = ids.indexOf(p.gap) + 1;
          const mark = p.gap in marks ? (marks[p.gap] ? "border-success" : "border-danger") : "";
          return (
            <span key={i} className="mx-1 inline-flex items-center gap-1 align-middle">
              {g.kind === "choice" ? (
                <select aria-label={s.gap(n)} className={`${input} ${mark}`} value={values[p.gap] ?? ""} onChange={(e) => set(p.gap, e.target.value)}>
                  <option value="">—</option>
                  {g.options.map((o, k) => (
                    <option key={k} value={k}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input aria-label={s.gap(n)} inputMode="decimal" autoComplete="off" className={`${input} w-28 ${mark}`} value={values[p.gap] ?? ""} onChange={(e) => set(p.gap, e.target.value)} />
                  {g.unitHtml && <Html inline html={g.unitHtml} />}
                </>
              )}
            </span>
          );
        })}
      </p>
      <button type="submit" className={`${primary} mt-3`}>
        {s.check}
      </button>
      <Result feedback={feedback} />
    </form>
  );
}

function AnswerArea({ answer, s }: { answer: ClientAnswer; s: ExerciseStrings }): ReactNode {
  switch (answer.kind) {
    case "numeric":
      return <NumericAnswer answer={answer} s={s} />;
    case "symbolic":
      return <SymbolicAnswer answer={answer} s={s} />;
    case "mcq":
      return <ChoiceList legend={s.chooseOption} options={answer.options} isCorrect={(id) => !!answer.options.find((o) => o.id === id)?.correct} s={s} />;
    case "wrong-step":
      return <ChoiceList legend={s.chooseWrongStep} options={answer.steps} isCorrect={(id) => id === answer.wrong} s={s} />;
    case "order":
      return <OrderAnswer answer={answer} s={s} />;
    case "gaps":
      return <GapsAnswer answer={answer} s={s} />;
  }
}

export function ExerciseRunner({ exercise, number }: { exercise: ClientExercise; number?: number }) {
  const { locale } = useLocale();
  const s = exerciseStrings[locale];
  const [variant, setVariant] = useState(0);
  const v = exercise.variants[variant];
  const count = exercise.variants.length;

  return (
    <ExerciseCard
      // a new variant starts fresh: hints hidden, answer cleared
      key={variant}
      number={number}
      level={exercise.level}
      badge={
        exercise.draft ? (
          <span className="rounded-sm border border-dashed border-warning px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-foreground uppercase">
            {s.draft}
          </span>
        ) : undefined
      }
      statement={<Html html={v.statementHtml} />}
      answer={<AnswerArea answer={v.answer} s={s} />}
      hints={v.hintsHtml.map((h, i) => <Html key={i} html={h} />)}
      solution={<Html html={v.solutionHtml} />}
      actions={
        count > 1 ? (
          <button
            type="button"
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-2"
            onClick={() => setVariant((variant + 1) % count)}
          >
            {s.anotherVersion}
          </button>
        ) : undefined
      }
    />
  );
}
