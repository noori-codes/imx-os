import localFont from "next/font/local";

const focusClock = localFont({
  src: [
    {
      path: "../../../fonts/IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../fonts/IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-focus-clock",
  display: "swap",
});

/** Scope the Focus clock font to this route — don't pay for it app-wide. */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`${focusClock.variable} flex min-h-0 flex-1 flex-col`}>
      {children}
    </div>
  );
}
