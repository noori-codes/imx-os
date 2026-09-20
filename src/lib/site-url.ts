/**
 * Canonical public origin for auth redirects, metadata, and absolute links.
 * Prefer NEXT_PUBLIC_SITE_URL in .env / Vercel. Never hardcode localhost in prod.
 */

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
    origin.replace(/\/$/, ""),
  );
}

export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  // Ignore localhost SITE_URL on production deploys (common Vercel misconfig).
  if (
    explicit &&
    !(process.env.NODE_ENV === "production" && isLocalOrigin(explicit))
  ) {
    return stripTrailingSlash(explicit);
  }

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) {
    return `https://${stripTrailingSlash(vercelProd.replace(/^https?:\/\//, ""))}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${stripTrailingSlash(vercel.replace(/^https?:\/\//, ""))}`;
  }

  if (process.env.NODE_ENV === "production") {
    return "https://imx-os.vercel.app";
  }

  return "http://localhost:3000";
}

/**
 * Origin of the current browser request.
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

  return stripTrailingSlash(`${proto}://${host}`);
}

/**
 * OAuth redirectTo origin — public host in production, request host in local dev.
 * Never returns localhost when the app is serving a real deployment.
 */
export async function getOAuthRedirectOrigin(): Promise<string> {
  const requestOrigin = await getRequestOrigin();

  // Live traffic (Vercel / custom domain): always use that host.
  if (!isLocalOrigin(requestOrigin)) {
    return requestOrigin;
  }

  // Local `npm run dev`: keep localhost so PKCE cookies match.
  // If SITE_URL is production-only, still stay local while developing.
  if (process.env.NODE_ENV !== "production") {
    return requestOrigin;
  }

  // Production build somehow reached via localhost host header — use site URL.
  return getSiteOrigin();
}
