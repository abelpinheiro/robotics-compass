"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function Loading() {
  const { t } = useLocale();
  return (
    <div className="my-8 grid h-72 place-items-center rounded-card border border-border bg-surface text-sm text-muted">
      {t.viz.loading}
    </div>
  );
}

const NewtonEulerViz = dynamic(() => import("./NewtonEulerViz"), { ssr: false, loading: () => <Loading /> });

export default function NewtonEulerVizEmbed() {
  return <NewtonEulerViz />;
}
