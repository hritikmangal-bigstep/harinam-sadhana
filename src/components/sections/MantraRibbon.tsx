const MANTRA =
  "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे · हरे राम हरे राम राम राम हरे हरे";

/** §14.3 Maha Mantra marquee ribbon between hero and About. */
export function MantraRibbon() {
  // Repeat enough to fill the track; animation translates by -50%.
  const line = `${MANTRA} · ${MANTRA} · ${MANTRA} · `;
  return (
    <div className="mantra-ribbon" aria-label="Maha Mantra">
      <div className="mantra-track" aria-hidden="true">
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  );
}
