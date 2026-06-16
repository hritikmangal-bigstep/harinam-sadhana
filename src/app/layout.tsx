import type { Metadata, Viewport } from "next";
import { LotusWatermark } from "@/components/decor/LotusWatermark";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harinam Prabhu AI — Offer Your Chanting Session",
  description:
    "A sacred space for devotees to offer their daily chanting. Record your japa and share it as an offering.",
};

export const viewport: Viewport = {
  themeColor: "#E8680A",
  width: "device-width",
  initialScale: 1,
};

const festival = process.env.NEXT_PUBLIC_FESTIVAL ?? "";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-festival={festival}>
        <LotusWatermark />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
