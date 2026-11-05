import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Riff Journey",
    template: "%s · Riff Journey",
  },
  description:
    "Organiza challenges de guitarra, practica canciones y construye tu repertorio.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${syne.variable} ${dmSans.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
