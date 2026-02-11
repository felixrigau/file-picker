"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/view/utils";
import {
  ACTIONS_COLUMN_WIDTH,
  ROW_CONTENT_MIN_HEIGHT,
  STATUS_COLUMN_WIDTH,
} from "../../constants";

interface SkeletonRowProps {
  /** First cell (td) with padding, provided by the parent container. */
  nameCell: React.ReactNode;
}

export function SkeletonRow({ nameCell }: SkeletonRowProps) {
  return (
    <tr className="border-b border-border/50">
      {nameCell}
      <td className={cn(STATUS_COLUMN_WIDTH, "px-4 py-2")}>
        <Skeleton className="h-8 w-20" />
      </td>
      <td className={cn(ACTIONS_COLUMN_WIDTH, "px-4 py-2")}>
        <Skeleton className="h-8 w-16" />
      </td>
    </tr>
  );
}

/** Content for the name cell. Fills container width; padding is applied by parent td. */
export function SkeletonNameCellContent() {
  return (
    <div
      className={cn("flex w-full items-center gap-2", ROW_CONTENT_MIN_HEIGHT)}
    >
      <span aria-hidden className="w-5 shrink-0" />
      <Skeleton className="h-8 min-w-0 flex-1" />
    </div>
  );
}
