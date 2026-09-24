"use client";

import { useState } from "react";

import { useUser } from "@/components/providers/user-provider";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  className?: string;
  /** Pixel size of the circle. Default matches header controls (36). */
  size?: number;
};

/** Circular account face — OAuth photo, else initials. */
export function UserAvatar({ className, size = 36 }: UserAvatarProps) {
  const { name, initials, avatarUrl } = useUser();
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(avatarUrl) && !broken;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-muted/60 text-[11px] font-semibold tracking-wide text-foreground/80",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- OAuth hosts vary; avoid next/image remote config for now
        <img
          src={avatarUrl!}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="select-none" title={name}>
          {initials}
        </span>
      )}
    </span>
  );
}
