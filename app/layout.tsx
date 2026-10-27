import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import "./globals.css";

const sans = Noto_Sans_TC({ variable: "--font-sans-tc", weight: ["400", "500", "700"], display: "swap" });
const serif = Noto_Serif_TC({ variable: "--font-serif-tc", weight: ["600"], display: "swap" });

export const metadata: Metadata = {
  title: "社群交流規範產生器",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
