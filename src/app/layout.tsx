import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getSiteOrigin } from "@/lib/site-url";

import "./globals.css";

const geistSans = localFont({
  src: "../fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "IMX OS — Personal Operating System",
    template: "%s · IMX OS",
  },
  description: "Your private life-management system",
  applicationName: "IMX OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/imx-logo-64.png", type: "image/png", sizes: "64x64" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "IMX OS",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "IMX OS",
    title: "IMX OS — Personal Operating System",
    description: "Your private life-management system",
    images: [{ url: "/og-image.png", width: 512, height: 512, alt: "IMX OS" }],
  },
  twitter: {
    card: "summary",
    title: "IMX OS — Personal Operating System",
    description: "Your private life-management system",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ConfirmProvider>
              {children}
              <Toaster />
            </ConfirmProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
