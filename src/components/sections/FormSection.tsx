import { ContributionFlow } from "@/components/collect/ContributionFlow";
import { TulsiLeafField } from "@/components/decor/TulsiLeafField";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LampGlow({ side }: { side: "left" | "right" }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ top: 0, [side]: 0 }}
      aria-hidden="true"
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 50% 55%, rgba(232,104,10,0.32) 0%, rgba(194,88,122,0.20) 38%, rgba(212,160,23,0.12) 62%, transparent 80%)",
          filter: "blur(18px)",
        }}
      />
    </div>
  );
}

export function FormSection() {
  return (
    <section id="offer" className="relative mx-auto max-w-content px-4 pb-6 pt-2">
      <TulsiLeafField />
      <div className="relative mb-5 pt-2 text-center">
        <LampGlow side="left" />
        <LampGlow side="right" />
        <p className="font-heading text-caption uppercase tracking-[0.22em] text-primary mb-1">
          All glories to Śrīla Prabhupāda
        </p>
        <h2 className="font-heading text-[clamp(1.4rem,4vw,1.9rem)] font-semibold leading-tight text-heading">
          Contribute Your Chanting Session
        </h2>
        <p className="mt-1 font-body text-body-sm text-muted">
          AI Japa tracker · Counts rounds · Detects mistakes · Improves chanting
        </p>
        <p className="mt-1 font-body text-caption text-muted">{todayLabel()}</p>
      </div>

      {/* Description banner */}
      <div className="mb-4 rounded-xl border-l-[3px] border-l-primary bg-primary-light px-4 py-3 font-body text-body-sm leading-relaxed text-foreground">
        We need <strong className="text-info">500+ Japa recordings</strong> (1 round
        each) to train our AI across different voices &amp; accents. Send us your 1 round —
        takes ~8 min. 🙏
      </div>

      <ContributionFlow />
    </section>
  );
}
