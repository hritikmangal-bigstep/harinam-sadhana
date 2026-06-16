import { SubmissionForm } from "@/components/form/SubmissionForm";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function FormSection() {
  return (
    <section id="offer" className="mx-auto max-w-content px-4 py-6">
      <div className="mb-5 text-center">
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
        takes ~5 min. 🙏
      </div>

      <div className="card shadow-md border-[rgba(124,58,237,0.25)]">
        <SubmissionForm />
      </div>
    </section>
  );
}
