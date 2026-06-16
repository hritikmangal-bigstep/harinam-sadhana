import { LotusLogo } from "./LotusLogo";

interface BrandLogoProps {
  /** Public path to an official logo, or null/undefined to use the side-view lotus. */
  src?: string | null;
  size?: number;
}

/**
 * Shows an official logo when one is present in /public, otherwise the
 * side-view lotus. The src is resolved server-side (see getBrandLogoSrc), so a
 * missing file never triggers a 404 request.
 */
export function BrandLogo({ src, size = 28 }: BrandLogoProps) {
  if (!src) {
    return <LotusLogo size={size} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="ISKCON" style={{ height: size, width: "auto" }} />
  );
}
