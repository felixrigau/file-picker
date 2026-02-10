"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { memo } from "react";

export type SortOrder = "asc" | "desc";

interface FileTableProps {
  /** Domain file nodes to display (sorted data from parent) */
  resources: FileNode[];
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Called when user opens a folder (navigate into it) */
  onFolderOpen: (id: string, name: string) => void;
  /** Resource ids considered indexed (optimistic + API); used for Status and actions */
  indexedIds?: string[];
  /** Called when user requests index */
  onIndexRequest?: (node: FileNode) => void;
  /** Called when user requests de-index */
  onDeIndexRequest?: (node: FileNode) => void;
  /** Whether index mutation is pending for this resource */
  isIndexPending?: (resourceId: string) => boolean;
  /** Whether de-index mutation is pending for this resource */
  isDeIndexPending?: (resourceId: string) => boolean;
  /** Current sort order for Name column; enables sortable header */
  sortOrder?: SortOrder;
  /** Called when user clicks the Name header to toggle sort */
  onSortToggle?: () => void;
  /** Message when list is empty (e.g. "No files found" when filtered, "No files or folders" when folder empty) */
  emptyMessage?: string;
}

const nameCellClasses = {
  folder: "cursor-pointer font-medium",
  file: "cursor-default",
} as const;

const SKELETON_ROW_COUNT = 6;

const FileRow = memo(function FileRow({
  node,
  indexedIds,
  onFolderOpen,
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
}: {
  node: FileNode;
  indexedIds: Set<string>;
  onFolderOpen: (id: string, name: string) => void;
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isIndexPending?: (resourceId: string) => boolean;
  isDeIndexPending?: (resourceId: string) => boolean;
}) {
  const isFolder = node.type === "folder";
  const isIndexed = node.isIndexed || indexedIds.has(node.id);
  const canIndex = Boolean(onIndexRequest) && !isIndexed;
  const canDeIndex =
    Boolean(onDeIndexRequest) &&
    isIndexed &&
    Boolean(node.resourcePath);

  const indexPending = isIndexPending?.(node.id) ?? false;
  const deIndexPending = isDeIndexPending?.(node.id) ?? false;
  const actionDisabled = indexPending || deIndexPending;

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/50">
      <td className="px-4 py-2">
        <button
          type="button"
          onClick={() => isFolder && onFolderOpen(node.id, node.name)}
          disabled={!isFolder}
          className={cn(
            "w-full text-left",
            nameCellClasses[node.type],
          )}
        >
          {node.name}
        </button>
      </td>
      <td className="px-4 py-2 text-muted-foreground">
        {isFolder ? "Folder" : "File"}
      </td>
      <td className="w-28 min-w-28 px-4 py-2">
        <span
          className="inline-block w-20 text-xs"
          aria-label={isIndexed ? "Indexed" : "Not indexed"}
        >
          {isIndexed ? "Indexed" : "Not indexed"}
        </span>
      </td>
      <td className="w-12 px-4 py-2">
        {canIndex ? (
          <button
            type="button"
            onClick={() => onIndexRequest?.(node)}
            disabled={actionDisabled}
            aria-label="Index"
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            <Plus className="size-4" />
          </button>
        ) : canDeIndex ? (
          <button
            type="button"
            onClick={() => onDeIndexRequest?.(node)}
            disabled={actionDisabled}
            aria-label="Remove from index"
            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </td>
    </tr>
  );
});

/**
 * Table component that renders GDrive files/folders.
 * Handles only presentation and folder navigation; state lives in parent.
 */
export function FileTable({
  resources,
  isLoading,
  onFolderOpen,
  indexedIds = [],
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
  sortOrder = "asc",
  onSortToggle,
  emptyMessage = "No files found",
}: FileTableProps) {
  const indexedSet = new Set(indexedIds);
  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  if (isLoading) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-left font-medium">Type</th>
            <th className="w-28 min-w-28 px-4 py-2 text-left font-medium">
              Status
            </th>
            <th className="w-12 px-4 py-2" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-full max-w-48" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-16" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-20" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-8" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th
            className="px-4 py-2 text-left font-medium"
            aria-sort={sortOrder === "asc" ? "ascending" : "descending"}
          >
            {onSortToggle ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto gap-1.5 px-0 font-medium hover:bg-transparent"
                onClick={onSortToggle}
                aria-label={`Sort by name ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                Name
                <SortIcon className="size-4" />
              </Button>
            ) : (
              "Name"
            )}
          </th>
          <th className="px-4 py-2 text-left font-medium">Type</th>
          <th className="w-28 min-w-28 px-4 py-2 text-left font-medium">
            Status
          </th>
          <th className="w-12 px-4 py-2" aria-hidden />
        </tr>
      </thead>
      <tbody>
        {resources.map((node) => (
          <FileRow
            key={node.id}
            node={node}
            indexedIds={indexedSet}
            onFolderOpen={onFolderOpen}
            onIndexRequest={onIndexRequest}
            onDeIndexRequest={onDeIndexRequest}
            isIndexPending={isIndexPending}
            isDeIndexPending={isDeIndexPending}
          />
        ))}
      </tbody>
    </table>
  );
}
