"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { DbProvider } from "@/hooks/use-db";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <DbProvider>
        {children}
        <Toaster richColors position="top-center" />
      </DbProvider>
    </ThemeProvider>
  );
}
