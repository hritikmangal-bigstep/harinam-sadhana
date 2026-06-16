import { Reveal } from "@/components/decor/Reveal";

/** Full-width violet-to-rose Maha Mantra section with translation. */
export function MantraSection() {
  return (
    <section
      className="px-4 py-20"
      style={{
        background:
          "linear-gradient(135deg, #ede9fe 0%, #fce7f3 50%, #fef3c7 100%)",
        borderTop: "1px solid rgba(190,24,93,0.12)",
        borderBottom: "1px solid rgba(190,24,93,0.12)",
      }}
    >
      <Reveal className="mx-auto max-w-hero text-center">
        <h2 className="text-gold-foil mb-6 font-heading text-[clamp(1.6rem,5vw,2.25rem)] leading-tight">
          The Maha Mantra
        </h2>
        <p
          lang="sa"
          className="font-mantra text-[1.6rem] leading-relaxed text-heading md:text-[2rem]"
        >
          हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे
          <br />
          हरे राम हरे राम राम राम हरे हरे
        </p>
        <div className="verse-block mx-auto mt-8 max-w-content text-left">
          <p className="verse-transliteration">
            Hare Kṛṣṇa Hare Kṛṣṇa, Kṛṣṇa Kṛṣṇa Hare Hare / Hare Rāma Hare Rāma,
            Rāma Rāma Hare Hare
          </p>
          <p className="verse-translation" lang="en">
            O Lord, O divine energy of the Lord, please engage me in Your loving
            service.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
