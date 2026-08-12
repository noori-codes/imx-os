import { type ReactNode } from "react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PagePlaceholder({
  title,
  description,
  children,
}: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="rounded-xl border border-dashed bg-muted/30 p-8">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </div>
  );
}
