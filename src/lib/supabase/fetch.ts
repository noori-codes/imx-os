/**
 * Bound network waits so soft-nav never hangs for ~50s on dead sockets.
 * Same change set: wired via `supabase/{server,client,admin,middleware}.ts`
 * and `app/auth/callback/route.ts`.
 */
export const SUPABASE_FETCH_TIMEOUT_MS = 12_000;

/**
 * Fetch wrapper for Supabase clients.
 * Aborts after SUPABASE_FETCH_TIMEOUT_MS unless the caller already set a shorter signal.
 */
export function supabaseFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const timeoutMs = SUPABASE_FETCH_TIMEOUT_MS;
  const external = init?.signal;

  if (external?.aborted) {
    return Promise.reject(
      external.reason ?? new DOMException("Aborted", "AbortError"),
    );
  }

  const controller = new AbortController();
  const onExternalAbort = () => {
    controller.abort(external?.reason);
  };
  external?.addEventListener("abort", onExternalAbort, { once: true });

  const timer = setTimeout(() => {
    controller.abort(
      new DOMException(
        `Supabase request timed out after ${timeoutMs}ms`,
        "TimeoutError",
      ),
    );
  }, timeoutMs);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    external?.removeEventListener("abort", onExternalAbort);
  });
}
