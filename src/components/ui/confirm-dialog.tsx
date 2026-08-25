"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

const ConfirmContext = createContext<ConfirmFn | null>(null);

let externalConfirm: ConfirmFn | null = null;

/** Imperative confirm — use from event handlers. Requires ConfirmProvider. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (!externalConfirm) {
    console.error("[confirm] ConfirmProvider is not mounted");
    return Promise.resolve(false);
  }
  return externalConfirm(options);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const resolverRef = useRef<(value: boolean) => void>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
  });

  const close = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((current) => ({ ...current, open: false }));
  }, []);

  const confirmFn = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setState({
        open: true,
        title: options.title,
        description: options.description,
        confirmLabel: options.confirmLabel ?? "Continue",
        cancelLabel: options.cancelLabel ?? "Cancel",
        destructive: options.destructive ?? false,
      });
    });
  }, []);

  externalConfirm = confirmFn;

  const value = useMemo(() => confirmFn, [confirmFn]);
  const destructive = state.destructive === true;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          className={cn(
            "top-1/2 max-w-[22rem] -translate-y-1/2 overflow-hidden border-border/50 p-0",
            "bg-background/95 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-xl",
            "dark:bg-card/95",
          )}
        >
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-foreground/20 to-transparent"
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute -top-20 left-1/2 size-36 -translate-x-1/2 rounded-full blur-3xl",
              destructive ? "bg-destructive/15" : "bg-foreground/[0.06]",
            )}
            aria-hidden
          />

          <div className="relative px-6 pb-5 pt-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {destructive ? "Please confirm" : "Confirm"}
            </p>
            <DialogTitle className="mt-2.5 text-lg font-medium tracking-tight text-foreground">
              {state.title}
            </DialogTitle>
            {state.description ? (
              <DialogDescription className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                {state.description}
              </DialogDescription>
            ) : null}
          </div>

          <div className="relative grid grid-cols-2 gap-px border-t border-border/50 bg-border/40">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => close(false)}
              className="bg-background px-4 py-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset dark:bg-card"
            >
              {state.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={cn(
                "bg-background px-4 py-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset dark:bg-card",
                destructive
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-muted/40",
              )}
            >
              {state.confirmLabel ?? "Continue"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
