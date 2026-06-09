import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUMO — Prensados en frío",
  description:
    "Jugos naturales prensados en frío, hechos cada mañana en lotes limitados.",
  openGraph: {
    title: "LUMO — Prensados en frío",
    description:
      "Jugos naturales prensados en frío, hechos cada mañana en lotes limitados.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="bg-[#0D0D0D] text-[#F5F0E8] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
