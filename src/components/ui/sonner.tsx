"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={20}
      gap={10}
      duration={4200}
      visibleToasts={3}
      style={
        {
          "--width": "22rem",
        } as CSSProperties
      }
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "imx-toast-shell",
          closeButton: "hidden",
        },
      }}
      {...props}
    />
  );
}
