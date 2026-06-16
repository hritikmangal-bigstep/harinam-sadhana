import { BrandLogo } from "@/components/decor/BrandLogo";

export function Footer({ logoSrc }: { logoSrc?: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8">
      <div className="rangoli-strip" aria-hidden="true" />
      <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <BrandLogo src={logoSrc} size={36} />
        <p className="font-mantra text-mantra text-secondary">हरे कृष्ण</p>
        <p className="font-body text-caption text-muted">
          © {year} Harinam Sadhana · Offered in devotion
        </p>
      </div>
    </footer>
  );
}
