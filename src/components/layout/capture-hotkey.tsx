"use client";

import { useEffect } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function isVisible(el: HTMLElement) {
  if (el.closest("[hidden], [aria-hidden='true']")) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

function hasOpenModal() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], [role="dialog"][data-state="open"], [data-slot="dialog-content"][data-state="open"]',
    ),
  );
}

/**
 * Global “N” capture — focuses or activates the page’s primary capture control
 * marked with `data-imx-capture` (or `data-imx-capture-primary`).
 */
export function CaptureHotkey() {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (hasOpenModal()) return;

      const primary = Array.from(
        document.querySelectorAll<HTMLElement>("[data-imx-capture-primary]"),
      ).find(isVisible);

      const fallback = Array.from(
        document.querySelectorAll<HTMLElement>("[data-imx-capture]"),
      ).find(isVisible);

      const el = primary ?? fallback;
      if (!el) return;

      event.preventDefault();

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement
      ) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      el.click();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
