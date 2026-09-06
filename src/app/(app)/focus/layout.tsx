import { IBM_Plex_Mono } from "next/font/google";

const focusClock = IBM_Plex_Mono({
  variable: "--font-focus-clock",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/** Scope the Focus clock font to this route — don't pay for it app-wide. */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`${focusClock.variable} flex min-h-0 flex-1 flex-col`}>
      {children}
    </div>
  );
}
