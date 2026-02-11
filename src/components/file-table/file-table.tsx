"use client";

import { Button } from "@/components/ui/button";
import { SKELETON_ROW_COUNT } from "./constants";
import { ColumnsHeader } from "./components/header";
import { FileRow } from "./components/row";
import {
  SkeletonNameCellContent,
  SkeletonRow,
} from "./components/skeleton";
import type { FileTableProps } from "./types";
import { getNameCellPaddingLeftPx } from "./utils";

export function FileTable({
  resources,
  isLoading,
  indexedIds = [],
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
  sortOrder = "asc",
  onSortToggle,
  emptyMessage = "No files found",
  onResetFilters,
  onFolderHover,
  onFolderHoverCancel,
  onFolderToggle,
  expandedIds = new Set(),
}: FileTableProps) {
  const indexedSet = new Set(indexedIds);

  if (isLoading) {
    return (
      <table
        className="w-full table-fixed text-sm"
        role="table"
        aria-busy="true"
        aria-label="File list"
      >
        <ColumnsHeader />
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
            <SkeletonRow
              key={`skeleton-${index}`}
              nameCell={
                <td
                  className="py-2 pr-4"
                  style={{ paddingLeft: `${getNameCellPaddingLeftPx(0)}px` }}
                >
                  <SkeletonNameCellContent />
                </td>
              }
            />
          ))}
        </tbody>
      </table>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
        <p>{emptyMessage}</p>
        {onResetFilters ? (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <table
      className="w-full table-fixed text-sm"
      role="table"
      aria-label="File list"
    >
      <ColumnsHeader sortOrder={sortOrder} onSortToggle={onSortToggle} />
      <tbody>
        {resources.map((row) =>
          row.type === "resource" ? (
            <FileRow
              key={row.node.id}
              row={{ node: row.node, depth: row.depth }}
              indexedIds={indexedSet}
              expandedIds={expandedIds}
              onFolderHover={onFolderHover}
              onFolderHoverCancel={onFolderHoverCancel}
              onFolderToggle={onFolderToggle}
              onIndexRequest={onIndexRequest}
              onDeIndexRequest={onDeIndexRequest}
              isIndexPending={isIndexPending}
              isDeIndexPending={isDeIndexPending}
            />
          ) : (
            <SkeletonRow
              key={`skeleton-${row.folderId}-${row.index}`}
              nameCell={
                <td
                  className="py-2 pr-4"
                  style={{ paddingLeft: `${getNameCellPaddingLeftPx(row.depth)}px` }}
                >
                  <SkeletonNameCellContent />
                </td>
              }
            />
          ),
        )}
      </tbody>
    </table>
  );
}
