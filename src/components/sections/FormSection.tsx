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
    <section id="offer" className="mx-auto max-w-content px-4 py-16">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-[clamp(1.6rem,5vw,2.25rem)] font-semibold leading-tight text-heading">
          Your Offering
        </h2>
        <p className="mt-2 font-body text-body-sm text-muted">{todayLabel()}</p>
      </div>

      <div className="card shadow-md" style={{ borderColor: "rgba(124,58,237,0.25)" }}>
        <SubmissionForm />
      </div>
    </section>
  );
}
