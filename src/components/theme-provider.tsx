"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // next-themes injects an inline <script> for FOUC prevention. React 19 / Next 16
  // warn when a script is rendered inside a client component. Keep the real script
  // on the server; on the client, mark it as JSON so React skips the warning.
  // https://github.com/pacocoursey/next-themes/issues/387
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const);

  return (
    <NextThemesProvider {...props} scriptProps={scriptProps}>
      {children}
    </NextThemesProvider>
  );
}
