"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/decor/BrandLogo";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#how", label: "How It Works" },
];

export function Navbar({ logoSrc }: { logoSrc?: string | null }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-border backdrop-blur-md transition-shadow",
          scrolled ? "shadow-sm" : "",
        )}
        style={{ background: "rgba(255,248,238,0.9)" }}
      >
        <nav className="mx-auto flex h-14 max-w-container items-center justify-between px-4 md:h-16">
          <a href="#top" className="flex items-center gap-2">
            <BrandLogo src={logoSrc} size={28} />
            <span className="font-heading text-h4 font-semibold text-heading">
              Harinam Sadhana
            </span>
          </a>
          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="font-body text-body-sm text-foreground transition-colors hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="rangoli-strip" aria-hidden="true" />
    </>
  );
}
