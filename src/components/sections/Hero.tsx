import { TulsiLeafField } from "@/components/decor/TulsiLeafField";
import { AuraBackdrop } from "@/components/decor/AuraBackdrop";
import { RoundsBadge } from "./RoundsBadge";

export function Hero() {
  return (
    <section
      id="top"
      className="hero-light-pool relative flex min-h-[clamp(560px,72vh,760px)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center"
    >
      <AuraBackdrop />
      <TulsiLeafField />

      <div className="relative z-10 flex max-w-hero flex-col items-center gap-5">
        <p className="font-heading text-caption uppercase tracking-[0.28em] text-primary">
          All glories to Śrīla Prabhupāda
        </p>

        <div className="flex flex-col items-center gap-1">
          <p lang="sa" className="font-mantra text-mantra text-secondary">
            हरे कृष्ण
          </p>
          <p className="font-heading text-caption uppercase tracking-[0.22em] text-secondary">
            Hare Krishna
          </p>
        </div>

        <h1 className="font-heading text-[clamp(2rem,7vw,3.25rem)] font-semibold leading-[1.08] text-heading">
          Offer Your <span className="text-gold-foil">Chanting</span> Session
        </h1>

        <p className="max-w-content font-body text-body-lg text-muted">
          A sacred space to record your daily japa and offer it with devotion.
          Each round is a step on the path home.
        </p>

        <a
          href="#offer"
          className="btn-primary mt-2"
          style={{
            background: "#b34a08",
            boxShadow: "0 6px 24px rgba(140, 50, 4, 0.55), 0 2px 6px rgba(0,0,0,0.18)",
          }}
        >
          Begin Offering
        </a>

        <RoundsBadge />
      </div>
    </section>
  );
}
