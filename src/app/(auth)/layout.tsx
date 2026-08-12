import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
          IM
        </span>
        <span className="text-lg">IMX OS</span>
      </Link>
      {children}
    </div>
  );
}
