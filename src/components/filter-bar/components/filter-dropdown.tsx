"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cva } from "class-variance-authority";
import { cn } from "@/view/utils";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string; Icon: LucideIcon; iconClass: string }[];
  onValueChange: (value: T) => void;
  getOptionLabel: (value: T) => string;
}

const triggerCva = cva(
  [
    "gap-1.5 shrink-0 rounded-md border border-input",
    "bg-background font-medium text-sm",
  ],
  {
    variants: {
      active: {
        true: "border-primary/50 bg-primary/10 text-primary",
        false: "",
      },
    },
    defaultVariants: { active: false },
  },
);

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onValueChange,
  getOptionLabel,
}: FilterDropdownProps<T>) {
  const displayValue = getOptionLabel(value);
  const selectedOpt = options.find((o) => o.value === value);
  const isActive = value !== "all";
  const SelectedIcon = selectedOpt?.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(triggerCva({ active: isActive }))}
          aria-label={`${label}: ${displayValue}`}
          aria-haspopup="listbox"
          aria-expanded={undefined}
        >
          <span className="text-sm">{label}:</span>
          {SelectedIcon && selectedOpt && (
            <SelectedIcon
              className={cn("size-4 shrink-0", selectedOpt.iconClass)}
              aria-hidden
            />
          )}
          <span className="text-sm">{displayValue}</span>
          <ChevronDown
            className="size-4 shrink-0 opacity-70"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as T)}
        >
          {options.map((opt) => {
            const Icon = opt.Icon;
            return (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <Icon
                    className={cn("size-4 shrink-0", opt.iconClass)}
                    aria-hidden
                  />
                  {opt.label}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
