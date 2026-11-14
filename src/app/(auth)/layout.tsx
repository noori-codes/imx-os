import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="auth-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="auth-stage-wash" aria-hidden="true" />
      <div className="auth-stage-glow" aria-hidden="true" />
      <div className="relative z-1 flex w-full max-w-sm flex-col items-center">
        <Link
          href="/"
          className="auth-brand mb-9 flex flex-col items-center gap-3.5 text-center outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative size-14 overflow-hidden rounded-xl border border-border/40 bg-foreground/5 shadow-[0_18px_40px_-28px_var(--surface-elev)] sm:size-[4.25rem]">
            <Image
              src="/imx-logo-64.png"
              alt=""
              fill
              sizes="68px"
              className="object-cover"
              priority
              loading="eager"
            />
          </span>
          <span className="space-y-1.5">
            <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-[color-mix(in_oklab,var(--imx-signal)_70%,var(--muted-foreground))]">
              Welcome
            </span>
            <span className="block text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
              IMX OS
            </span>
            <span className="mx-auto block max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
              A quiet personal OS for focus, habits, and the day ahead.
            </span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
