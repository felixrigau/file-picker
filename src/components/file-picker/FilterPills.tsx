"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/view/utils";
import type { StatusFilter, TypeFilter } from "@/domain/types";
import {
  CheckCircle2,
  ChevronDown,
  CircleOff,
  File,
  FileText,
  Folder,
  ListFilter,
  Table,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STATUS_OPTIONS: {
  value: StatusFilter;
  label: string;
  Icon: LucideIcon;
  iconClass: string;
}[] = [
  { value: "all", label: "All", Icon: ListFilter, iconClass: "text-muted-foreground" },
  { value: "indexed", label: "Indexed", Icon: CheckCircle2, iconClass: "text-green-600" },
  { value: "not-indexed", label: "Not Indexed", Icon: CircleOff, iconClass: "text-muted-foreground" },
];

const TYPE_OPTIONS: {
  value: TypeFilter;
  label: string;
  Icon: LucideIcon;
  iconClass: string;
}[] = [
  { value: "all", label: "All", Icon: ListFilter, iconClass: "text-muted-foreground" },
  { value: "folder", label: "Folders", Icon: Folder, iconClass: "text-blue-500" },
  { value: "file", label: "Files", Icon: File, iconClass: "text-muted-foreground" },
  { value: "pdf", label: "PDF", Icon: FileText, iconClass: "text-red-500" },
  { value: "csv", label: "CSV", Icon: Table, iconClass: "text-green-600" },
  { value: "txt", label: "TXT", Icon: FileText, iconClass: "text-sky-500" },
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
  options: { value: T; label: string; Icon: LucideIcon; iconClass: string }[];
  onValueChange: (v: T) => void;
  getOptionLabel: (v: T) => string;
}) {
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
          className={cn(
            "gap-1.5 rounded-md border border-input bg-background font-medium",
            isActive && "border-primary/50 bg-primary/10 text-primary",
          )}
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
          <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onValueChange(v as T)}>
          {options.map((opt) => {
            const Icon = opt.Icon;
            return (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <Icon className={cn("size-4 shrink-0", opt.iconClass)} aria-hidden />
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
