import { Reveal } from "@/components/decor/Reveal";

export function AboutStrip() {
  return (
    <section id="about" className="mx-auto max-w-container px-4 py-16">
      <Reveal>
        <p className="drop-cap mx-auto mb-6 max-w-content text-center font-body text-body-lg text-foreground">
          Harinam Sadhana is a quiet place to offer your daily chanting. No
          accounts, no noise — only your voice, your rounds, and the holy name.
        </p>
      </Reveal>
      <Reveal>
        <p className="mx-auto max-w-content text-center font-body text-body text-muted">
          We need your chanting sessions for the training of our model and
          application which analyses your chanting — helping us build a tool
          that understands and honours your devotional practice.
        </p>
      </Reveal>
    </section>
  );
}
