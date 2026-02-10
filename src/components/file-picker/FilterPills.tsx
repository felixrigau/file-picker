"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StatusFilter, TypeFilter } from "@/types";
import { ChevronDown } from "lucide-react";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indexed", label: "Indexed" },
  { value: "not-indexed", label: "Not Indexed" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "folder", label: "Folders" },
  { value: "file", label: "Files" },
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "txt", label: "TXT" },
];

function FilterPill<T extends string>({
  label,
  value,
  options,
  onValueChange,
  getOptionLabel,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onValueChange: (v: T) => void;
  getOptionLabel: (v: T) => string;
}) {
  const displayValue = getOptionLabel(value);
  const isActive = value !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 rounded-md border border-input bg-background font-medium",
            isActive && "border-primary/50 bg-primary/10 text-primary",
          )}
          aria-label={`${label}: ${displayValue}`}
          aria-haspopup="listbox"
          aria-expanded={undefined}
        >
          <span className="text-sm">{label}:</span>
          <span className="text-sm">{displayValue}</span>
          <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onValueChange(v as T)}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FilterPillsProps {
  status: StatusFilter;
  type: TypeFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterPills({
  status,
  type,
  onStatusChange,
  onTypeChange,
  onClearFilters,
  hasActiveFilters,
}: FilterPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPill
        label="Type"
        value={type}
        options={TYPE_OPTIONS}
        onValueChange={onTypeChange}
        getOptionLabel={(v) => TYPE_OPTIONS.find((o) => o.value === v)?.label ?? "All"}
      />
      <FilterPill
        label="Status"
        value={status}
        options={STATUS_OPTIONS}
        onValueChange={onStatusChange}
        getOptionLabel={(v) => STATUS_OPTIONS.find((o) => o.value === v)?.label ?? "All"}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
