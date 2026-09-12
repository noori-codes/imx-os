"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type BrandSelectOption = {
  value: string;
  label: string;
};

const EMPTY_VALUE = "__imx_empty__";

type BrandSelectProps = {
  options: BrandSelectOption[];
  /** Form field name — renders a hidden input for native FormData submit. */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /** Compact trigger for dense tables. */
  size?: "sm" | "default";
  align?: "start" | "center" | "end";
};

function toInternal(value: string) {
  return value === "" ? EMPTY_VALUE : value;
}

function fromInternal(value: string) {
  return value === EMPTY_VALUE ? "" : value;
}

export function BrandSelect({
  options,
  name,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  placeholder = "Select",
  "aria-label": ariaLabel,
  id,
  disabled,
  className,
  size = "default",
  align = "start",
}: BrandSelectProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolled;

  const selected = options.find((option) => option.value === value);
  const label = selected?.label ?? placeholder;

  function handleChange(next: string) {
    const resolved = fromInternal(next);
    if (!isControlled) setUncontrolled(resolved);
    onValueChange?.(resolved);
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            id={id}
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              "group inline-flex w-full items-center justify-between gap-2 border border-border/50 bg-card/70 text-left text-sm text-foreground outline-none transition-colors",
              "hover:border-border hover:bg-card",
              "focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:pointer-events-none disabled:opacity-50",
              !selected && "text-muted-foreground",
              size === "sm"
                ? "h-8 rounded-lg px-2.5 text-xs"
                : "h-9 rounded-xl px-3",
              className,
            )}
          >
            <span className="min-w-0 truncate">{label}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          <DropdownMenuRadioGroup
            value={toInternal(value)}
            onValueChange={handleChange}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value === "" ? EMPTY_VALUE : option.value}
                value={toInternal(option.value)}
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
