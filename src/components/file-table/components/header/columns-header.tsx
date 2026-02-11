"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/view/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  ACTIONS_COLUMN_WIDTH,
  STATUS_COLUMN_WIDTH,
} from "../../constants";
import type { SortOrder } from "../../types";

interface ColumnsHeaderProps {
  sortOrder?: SortOrder;
  onSortToggle?: () => void;
}

/** Simplest header: no sort toggle (e.g. loading state) */
function SimpleColumnsHeader() {
  return (
    <thead>
      <tr className="border-b border-border">
        <th className="px-4 py-2 text-left font-medium">Name</th>
        <th
          className={cn(
            STATUS_COLUMN_WIDTH,
            "px-4 py-2 text-left font-medium",
          )}
        >
          Status
        </th>
        <th
          className={cn(ACTIONS_COLUMN_WIDTH, "px-4 py-2")}
          aria-hidden
        />
      </tr>
    </thead>
  );
}

/** Full header with sortable Name column */
function SortableColumnsHeader({
  sortOrder = "asc",
  onSortToggle,
}: Required<ColumnsHeaderProps>) {
  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;
  const sortAriaLabel = `Sort by name ${sortOrder === "asc" ? "descending" : "ascending"}`;

  return (
    <thead>
      <tr className="border-b border-border">
        <th
          className="px-4 py-2 text-left font-medium"
          aria-sort={sortOrder === "asc" ? "ascending" : "descending"}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1.5 px-0 font-medium hover:bg-transparent"
            aria-label={sortAriaLabel}
            onClick={onSortToggle}
          >
            Name
            <SortIcon className="size-4" />
          </Button>
        </th>
        <th
          className={cn(
            STATUS_COLUMN_WIDTH,
            "px-4 py-2 text-left font-medium",
          )}
        >
          Status
        </th>
        <th
          className={cn(
            ACTIONS_COLUMN_WIDTH,
            "px-4 py-2 text-right font-medium",
          )}
        >
          Actions
        </th>
      </tr>
    </thead>
  );
}

export function ColumnsHeader({
  sortOrder = "asc",
  onSortToggle,
}: ColumnsHeaderProps) {
  if (onSortToggle) {
    return (
      <SortableColumnsHeader
        sortOrder={sortOrder}
        onSortToggle={onSortToggle}
      />
    );
  }
  return <SimpleColumnsHeader />;
}
