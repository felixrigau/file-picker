"use client";

import type { FileNode } from "@/domain/types";
import { memo } from "react";
import type { ResourceRow } from "../../types";
import { getTreeIndentPaddingPx } from "../../utils";
import { FileRowActionsCell } from "./file-row-actions-cell";
import { FileRowNameCell } from "./file-row-name-cell";
import { FileRowStatusCell } from "./file-row-status-cell";

interface FileRowProps {
  row: ResourceRow;
  indexedIds: Set<string>;
  expandedIds?: Set<string>;
  onFolderHover?: (folderId: string) => void;
  onFolderHoverCancel?: (folderId: string) => void;
  onFolderToggle?: (folderId: string) => void;
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isIndexPending?: (resourceId: string) => boolean;
  isDeIndexPending?: (resourceId: string) => boolean;
}

export const FileRow = memo(function FileRow({
  row,
  indexedIds,
  expandedIds,
  onFolderHover,
  onFolderHoverCancel,
  onFolderToggle,
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
}: FileRowProps) {
  const { node, depth } = row;
  const isFolder = node.type === "folder";
  const isIndexed = node.isIndexed || indexedIds.has(node.id);
  const canIndex = Boolean(onIndexRequest) && !isIndexed;
  const canDeIndex =
    Boolean(onDeIndexRequest) && isIndexed && Boolean(node.resourcePath);
  const isExpanded = isFolder && (expandedIds?.has(node.id) ?? false);
  const indexPending = isIndexPending?.(node.id) ?? false;
  const deIndexPending = isDeIndexPending?.(node.id) ?? false;
  const actionDisabled = indexPending || deIndexPending;
  const paddingLeftPx = getTreeIndentPaddingPx(depth);

  const handleToggleFolder = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isFolder) {
      onFolderToggle?.(node.id);
    }
  };

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/50">
      <FileRowNameCell
        node={node}
        isFolder={isFolder}
        isExpanded={isExpanded}
        paddingLeftPx={paddingLeftPx}
        onToggleFolder={handleToggleFolder}
        onFolderHover={onFolderHover}
        onFolderHoverCancel={onFolderHoverCancel}
      />
      <FileRowStatusCell isIndexed={isIndexed} />
      <FileRowActionsCell
        node={node}
        canIndex={canIndex}
        canDeIndex={canDeIndex}
        actionDisabled={actionDisabled}
        indexPending={indexPending}
        deIndexPending={deIndexPending}
        onIndexRequest={onIndexRequest}
        onDeIndexRequest={onDeIndexRequest}
      />
    </tr>
  );
});
