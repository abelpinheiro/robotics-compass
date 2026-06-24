import { Callout } from "@/components/lesson/Callout";
import { StudyRoadmap } from "@/components/StudyRoadmap";
import { getServerDictionary } from "@/lib/i18n/server";

export default async function Home() {
  const t = await getServerDictionary();
  return (
    <div>
      <div className="lesson-prose">
        <p className="mb-2 text-sm font-medium tracking-wide text-accent uppercase">
          {t.home.kicker}
        </p>
        <h1 className="text-[2rem] leading-tight font-semibold">
          Robotics Compass
        </h1>
        <p className="mt-3 text-lg text-muted">{t.home.tagline}</p>

        <Callout variant="info" title={t.home.calloutTitle}>
          {t.home.calloutBody}
        </Callout>
      </div>

      <div className="mt-10">
        <StudyRoadmap />
      </div>
    </div>
  );
}
