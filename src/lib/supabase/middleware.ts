import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const PUBLIC_ROUTES = ["/auth/callback", "/setup"];
/** Needs a session (recovery link or signed-in) but stays on the auth chrome. */
const SESSION_AUTH_ROUTES = ["/update-password"];

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isSessionAuthRoute(pathname: string) {
  return SESSION_AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("-auth-token") ||
        cookie.name.startsWith("sb-"),
    );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // OAuth PKCE codes must hit the exchange route (never /login?code=…).
  // Provider errors include error_description / error_code — not our UI ?error=.
  const authCode = request.nextUrl.searchParams.get("code");
  const providerError =
    request.nextUrl.searchParams.has("error_description") ||
    request.nextUrl.searchParams.has("error_code");
  if (
    (authCode || providerError) &&
    !pathname.startsWith("/auth/callback")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  if (!isSupabaseConfigured()) {
    if (pathname !== "/setup") {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  // Fast path: no auth cookie → skip network call for protected routes
  if (
    !hasSupabaseAuthCookie(request) &&
    !isAuthRoute(pathname) &&
    !isPublicRoute(pathname) &&
    !isSessionAuthRoute(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getSession reads the JWT from cookies (local) — much faster than getUser (network).
  // Real validation still happens in the app layout via getUser().
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  if (!user && isSessionAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/forgot-password";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && !isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
