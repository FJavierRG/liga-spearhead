import type { Metadata } from "next";
import { Cinzel, Crimson_Pro } from "next/font/google";
import { Toaster } from "sonner";
import { StaticDemoBanner } from "@/components/demo/static-demo-banner";
import { RataCornerDecoration } from "@/components/layout/rata-corner-decoration";
import { isStaticDemo } from "@/lib/config";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["500", "600", "700"],
});

const crimson = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Liga Spearhead",
  description: "Liga local de Age of Sigmar: Spearhead",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cinzel.variable} ${crimson.variable} h-full`}
      {...(isStaticDemo() ? { "data-static-demo": "" } : {})}
    >
      <body className="relative min-h-full font-sans text-[var(--foreground)] antialiased">
        <StaticDemoBanner />
        {children}
        <RataCornerDecoration />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
