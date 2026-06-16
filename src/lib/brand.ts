import { existsSync } from "fs";
import path from "path";

/** Logo filenames we look for in /public, in priority order. */
const CANDIDATES = [
  "iskcon-logo.svg",
  "iskcon-logo.png",
  "iskcon-logo.webp",
  "iskcon-logo.jpg",
];

/**
 * Returns the public path of the official ISKCON logo if one has been added to
 * /public, otherwise null (so the UI renders the lotus emblem fallback instead
 * of requesting a missing file and 404-ing). Server-only — uses the filesystem.
 */
export function getBrandLogoSrc(): string | null {
  const dir = path.join(process.cwd(), "public");
  for (const file of CANDIDATES) {
    if (existsSync(path.join(dir, file))) return `/${file}`;
  }
  return null;
}
