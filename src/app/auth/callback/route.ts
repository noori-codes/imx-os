import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { friendlyAuthError } from "@/lib/auth-messages";
import { getSupabaseEnv } from "@/lib/supabase/env";

function callbackOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto");
  if (forwardedHost) {
    const safeProto =
      proto === "http" || proto === "https"
        ? proto
        : forwardedHost.includes("localhost")
          ? "http"
          : "https";
    return `${safeProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

function safeNextPath(raw: string | null) {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  // Stay inside the app — no protocol-relative or external paths.
  if (raw.includes("://")) return "/dashboard";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = callbackOrigin(request);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const providerError = searchParams.get("error");
  const providerDescription = searchParams.get("error_description");

  if (providerError && !code) {
    const detail = friendlyAuthError(
      providerDescription?.replace(/\+/g, " ") ?? providerError,
    );
    const url = new URL("/login", origin);
    url.searchParams.set("error", "oauth");
    url.searchParams.set("message", detail);
    return NextResponse.redirect(url);
  }

  if (code) {
    const redirectResponse = NextResponse.redirect(new URL(next, origin));
    const { url, key } = getSupabaseEnv();

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectResponse;
    }

    console.error("[auth/callback]", error.message);
    const fail = new URL("/login", origin);
    fail.searchParams.set("error", "auth_callback_failed");
    fail.searchParams.set(
      "message",
      friendlyAuthError(error.message) ||
        "Social sign-in didn’t finish. Try again, or use email.",
    );
    return NextResponse.redirect(fail);
  }

  const fail = new URL("/login", origin);
  fail.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(fail);
}
