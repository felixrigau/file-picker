"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/view/utils";
import { ROW_CONTENT_MIN_HEIGHT, STATUS_COLUMN_WIDTH } from "../../constants";

interface FileRowStatusCellProps {
  isIndexed: boolean;
}

export function FileRowStatusCell({ isIndexed }: FileRowStatusCellProps) {
  return (
    <td className={cn(STATUS_COLUMN_WIDTH, "px-4 py-2")}>
      <span className={cn("inline-flex items-center", ROW_CONTENT_MIN_HEIGHT)}>
        {isIndexed ? (
          <Badge variant="primary">Indexed</Badge>
        ) : (
          <Badge variant="secondary">Not indexed</Badge>
        )}
      </span>
    </td>
  );
}
