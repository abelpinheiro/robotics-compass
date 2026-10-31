"use client";

import { useEffect, useState, type RefObject } from "react";
import { checkConditions } from "@/lib/exercises/check";
import { planarArmValues, snapAngle } from "@/lib/exercises/planarArm";
import type { ClientAnswer } from "@/lib/exercises/types";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PlanarArmWidget } from "./PlanarArmWidget";
import type { ExerciseStrings } from "./strings";
import { primaryButton, Result, secondaryButton, type Feedback } from "./ui";

/**
 * Answer area of an interactive exercise (loaded lazily by ExerciseRunner):
 * the reader moves the widget, and "check" tests the server-built conditions
 * on its quantities. `showRef` receives a function that puts a state on the
 * widget, used by the solution's "show it on the arm".
 */
export default function InteractiveAnswer({
  answer,
  s,
  showRef,
}: {
  answer: Extract<ClientAnswer, { kind: "interactive" }>;
  s: ExerciseStrings;
  showRef: RefObject<((angles: number[]) => void) | null>;
}) {
  const { locale } = useLocale();
  const { setup, conditions } = answer;
  const [angles, setAngles] = useState(setup.initial);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const move = (next: number[]) => (setAngles(next), setFeedback(null));

  useEffect(() => {
    showRef.current = (target) => move(target.map((a) => snapAngle(a, setup.step ?? 1)));
    return () => {
      showRef.current = null;
    };
  });

  const check = () => {
    const r = checkConditions(planarArmValues(setup, angles), conditions);
    setFeedback(r.ok ? { ok: true, message: s.correct } : { ok: false, message: s.incorrect, detailHtml: conditions[r.failed[0]].feedbackHtml });
  };

  return (
    <>
      <PlanarArmWidget setup={setup} angles={angles} onChange={move} s={s} locale={locale} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={primaryButton} onClick={check}>
          {s.check}
        </button>
        <button type="button" className={secondaryButton} onClick={() => move(setup.initial)}>
          {s.resetArm}
        </button>
      </div>
      <Result feedback={feedback} />
    </>
  );
}
