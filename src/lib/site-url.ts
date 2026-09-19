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
