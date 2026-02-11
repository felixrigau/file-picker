"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/view/utils";
import type { FileNode } from "@/domain/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ACTIONS_COLUMN_WIDTH, ROW_CONTENT_MIN_HEIGHT } from "../../constants";

interface FileRowActionsCellProps {
  node: FileNode;
  canIndex: boolean;
  canDeIndex: boolean;
  actionDisabled: boolean;
  indexPending: boolean;
  deIndexPending: boolean;
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
}

export function FileRowActionsCell({
  node,
  canIndex,
  canDeIndex,
  actionDisabled,
  indexPending,
  deIndexPending,
  onIndexRequest,
  onDeIndexRequest,
}: FileRowActionsCellProps) {
  return (
    <td className={cn(ACTIONS_COLUMN_WIDTH, "px-4 py-2 text-right")}>
      <span
        className={cn(
          "flex items-center justify-end",
          ROW_CONTENT_MIN_HEIGHT,
        )}
      >
        {canIndex ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            disabled={actionDisabled}
            onClick={() => onIndexRequest?.(node)}
          >
            {indexPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Index
          </Button>
        ) : canDeIndex ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={actionDisabled}
            onClick={() => onDeIndexRequest?.(node)}
          >
            {deIndexPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Remove
          </Button>
        ) : null}
      </span>
    </td>
  );
}
