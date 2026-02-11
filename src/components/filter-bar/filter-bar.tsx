"use client";

import { Button } from "@/components/ui/button";
import { FilterDropdown } from "./components/filter-dropdown";
import {
  getStatusFilterLabel,
  getTypeFilterLabel,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "./filter-bar-mappers";
import type { StatusFilter, TypeFilter } from "@/domain/types";

interface FilterBarProps {
  status: StatusFilter;
  type: TypeFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const clearButtonClasses = [
  "rounded-md text-sm font-medium",
  "text-muted-foreground",
  "hover:bg-transparent hover:text-foreground",
].join(" ");

export function FilterBar({
  status,
  type,
  onStatusChange,
  onTypeChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterDropdown
        label="Type"
        value={type}
        options={TYPE_OPTIONS}
        onValueChange={onTypeChange}
        getOptionLabel={getTypeFilterLabel}
      />
      <FilterDropdown
        label="Status"
        value={status}
        options={STATUS_OPTIONS}
        onValueChange={onStatusChange}
        getOptionLabel={getStatusFilterLabel}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className={clearButtonClasses}
          aria-label="Clear all filters"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
