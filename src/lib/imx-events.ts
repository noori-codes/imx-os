/** Shared window events for cross-component chrome. */
export const IMX_OPEN_COACH_EVENT = "imx:open-coach";
export const IMX_OPEN_CAPTURE_EVENT = "imx:open-capture";

export function openImxCoach() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMX_OPEN_COACH_EVENT));
}

export function openImxCapture() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(IMX_OPEN_CAPTURE_EVENT));
}
