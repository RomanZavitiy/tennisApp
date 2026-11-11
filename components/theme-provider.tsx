"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Dark mode: next-themes puts `class="dark"` on <html> before the first
// paint (so there is no flash of the light theme), follows the system
// setting by default and keeps an explicit choice in localStorage.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
