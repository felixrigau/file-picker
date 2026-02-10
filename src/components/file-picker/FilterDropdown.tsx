"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StatusFilter, TypeFilter } from "@/types";
import { ListFilter } from "lucide-react";

interface FilterDropdownProps {
  status: StatusFilter;
  type: TypeFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indexed", label: "Indexed" },
  { value: "not-indexed", label: "Not Indexed" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "folder", label: "Folders" },
  { value: "file", label: "Files" },
];

export function FilterDropdown({
  status,
  type,
  onStatusChange,
  onTypeChange,
  onClearFilters,
  hasActiveFilters,
}: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          aria-label="Filter options"
        >
          <ListFilter
            className={cn(
              "size-4 shrink-0",
              hasActiveFilters ? "text-primary" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <span className="text-sm font-medium">Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Status
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(v) => onStatusChange(v as StatusFilter)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Type
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={type}
          onValueChange={(v) => onTypeChange(v as TypeFilter)}
        >
          {TYPE_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClearFilters}>
          Clear filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
