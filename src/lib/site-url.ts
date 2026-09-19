/**
 * Canonical public origin for auth redirects, metadata, and absolute links.
 * Prefer NEXT_PUBLIC_SITE_URL in .env / Vercel. Never hardcode localhost in prod.
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    return `https://${vercelProd.replace(/^https?:\/\//, "")}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }

  if (process.env.NODE_ENV === "production") {
    return "https://imx-os.vercel.app";
  }

  return "http://localhost:3000";
}

/**
 * Origin of the current browser request (for OAuth redirectTo).
 * Must match where the user started so PKCE cookies stay on the same host.
 */
export async function getRequestOrigin(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return getSiteOrigin();

  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`.replace(/\/$/, "");
}
