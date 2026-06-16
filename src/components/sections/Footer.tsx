import { BrandLogo } from "@/components/decor/BrandLogo";

export function Footer({ logoSrc }: { logoSrc?: string | null }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-4">
      <div className="rangoli-strip" aria-hidden="true" />
      <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
        <BrandLogo src={logoSrc} size={36} />
        <p className="font-mantra text-mantra text-secondary">हरे कृष्ण</p>
        <p className="font-body text-caption text-muted">
          © {year} Harinam Prabhu AI · Offered in devotion
        </p>
      </div>
    </footer>
  );
}
