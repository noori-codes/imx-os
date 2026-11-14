/** Shared window events for cross-component chrome. */
export const IMX_OPEN_COACH_EVENT = "imx:open-coach";
export const IMX_OPEN_CAPTURE_EVENT = "imx:open-capture";
export const IMX_OPEN_SEARCH_EVENT = "imx:open-search";

export function openImxCoach() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMX_OPEN_COACH_EVENT));
}

export function openImxCapture() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMX_OPEN_CAPTURE_EVENT));
}

export function openImxSearch() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMX_OPEN_SEARCH_EVENT));
}
