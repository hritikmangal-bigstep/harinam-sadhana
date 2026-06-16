import { Reveal } from "@/components/decor/Reveal";

const STEPS = [
  {
    n: "1",
    title: "Share your details",
    body: "Your name, email, and a few words about today's sadhana.",
  },
  {
    n: "2",
    title: "Record your chanting",
    body: "Hold the saffron button and let the holy name fill the space.",
  },
  {
    n: "3",
    title: "Offer your session",
    body: "Release and offer — your session is received with gratitude.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-container px-4 pt-8 pb-16">
      <Reveal>
        <h2 className="mb-10 text-center font-heading text-h2 text-heading">
          How It Works
        </h2>
      </Reveal>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <li className="glass-card relative h-full list-none text-center">
              <span
                aria-hidden="true"
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light font-heading text-h3 text-primary"
              >
                {s.n}
              </span>
              <h3 className="mb-2 font-heading text-h3 text-heading">
                {s.title}
              </h3>
              <p className="font-body text-body text-foreground">{s.body}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
