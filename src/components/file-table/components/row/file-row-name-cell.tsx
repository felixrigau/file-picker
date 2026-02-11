"use client";

import type { FileNode } from "@/domain/types";
import { cn } from "@/view/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { memo } from "react";
import { ROW_CONTENT_MIN_HEIGHT } from "../../constants";
import { FileIcon } from "./file-icon";
import { NAME_CELL_CLASSES_BY_TYPE } from "./file-row.constants";

interface FileRowNameCellProps {
  node: FileNode;
  isFolder: boolean;
  isExpanded: boolean;
  paddingLeftPx: number;
  onToggleFolder: () => void;
  onFolderHover?: (folderId: string) => void;
  onFolderHoverCancel?: (folderId: string) => void;
}

function FileRowNameCellContent({
  node,
  isFolder,
  isExpanded,
  paddingLeftPx,
  onToggleFolder,
  onFolderHover,
  onFolderHoverCancel,
}: FileRowNameCellProps) {
  const expandCollapseAriaLabel = `${node.name}, folder, ${isExpanded ? "expanded" : "collapsed"}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleFolder();
    }
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2",
        ROW_CONTENT_MIN_HEIGHT,
        NAME_CELL_CLASSES_BY_TYPE[node.type],
      )}
      style={{ paddingLeft: `${paddingLeftPx}px` }}
    >
      {isFolder ? (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={expandCollapseAriaLabel}
          className="inline-flex w-fit cursor-pointer items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFolder();
          }}
          onMouseEnter={() => onFolderHover?.(node.id)}
          onMouseLeave={() => onFolderHoverCancel?.(node.id)}
          onKeyDown={handleKeyDown}
        >
          <span
            aria-hidden
            className="shrink-0 rounded p-0.5 text-muted-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
          <FileIcon type={node.type} name={node.name} />
          <span className="min-w-0 truncate">{node.name}</span>
        </span>
      ) : (
        <>
          <span aria-hidden className="w-5 shrink-0" />
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <FileIcon type={node.type} name={node.name} />
            <span className="min-w-0 truncate">{node.name}</span>
          </span>
        </>
      )}
    </div>
  );
}

const MemoizedFileRowNameCell = memo(FileRowNameCellContent);

export function FileRowNameCell(props: FileRowNameCellProps) {
  return (
    <td className="px-4 py-2">
      <MemoizedFileRowNameCell {...props} />
    </td>
  );
}
