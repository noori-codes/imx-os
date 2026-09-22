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
          className="auth-brand mb-8 flex flex-col items-center gap-3 text-center"
        >
          <span className="relative size-14 overflow-hidden rounded-2xl border border-border/50 bg-foreground/5 shadow-sm sm:size-16">
            <Image
              src="/imx-logo-64.png"
              alt=""
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </span>
          <span className="space-y-1">
            <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
              IMX OS
            </span>
            <span className="block text-sm text-muted-foreground">
              Your personal operating system
            </span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
