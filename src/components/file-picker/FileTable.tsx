"use client";

import { cn } from "@/lib/utils";
import type { FileNode } from "@/types";
import { Trash2 } from "lucide-react";
import { memo } from "react";

interface FileTableProps {
  /** Domain file nodes to display (data from useGDriveFiles) */
  resources: FileNode[];
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Called when user opens a folder (navigate into it) */
  onFolderOpen: (id: string, name: string) => void;
  /** Resource ids considered indexed (optimistic + API); used for Delete visibility */
  indexedIds?: string[];
  /** Called when user requests de-index; when present, Delete column is shown */
  onDeIndexRequest?: (node: FileNode) => void;
  /** Whether de-index mutation is pending (disables Delete buttons) */
  isDeIndexPending?: boolean;
}

const nameCellClasses = {
  folder: "cursor-pointer font-medium",
  file: "cursor-default",
} as const;

const FileRow = memo(function FileRow({
  node,
  indexedIds,
  onFolderOpen,
  onDeIndexRequest,
  isDeIndexPending,
}: {
  node: FileNode;
  indexedIds: Set<string>;
  onFolderOpen: (id: string, name: string) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isDeIndexPending?: boolean;
}) {
  const isFolder = node.type === "folder";
  const isIndexed =
    node.isIndexed || indexedIds.has(node.id);
  const canDeIndex =
    Boolean(onDeIndexRequest) &&
    isIndexed &&
    Boolean(node.resourcePath) &&
    node.type === "file";

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
      {onDeIndexRequest != null && (
        <td className="w-12 px-4 py-2">
          {canDeIndex ? (
            <button
              type="button"
              onClick={() => onDeIndexRequest(node)}
              disabled={isDeIndexPending}
              aria-label="Remove from index"
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </td>
      )}
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
  onDeIndexRequest,
  isDeIndexPending = false,
}: FileTableProps) {
  const indexedSet = new Set(indexedIds);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No files or folders
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="px-4 py-2 text-left font-medium">Name</th>
          <th className="px-4 py-2 text-left font-medium">Type</th>
          {onDeIndexRequest != null && (
            <th className="w-12 px-4 py-2" aria-hidden />
          )}
        </tr>
      </thead>
      <tbody>
        {resources.map((node) => (
          <FileRow
            key={node.id}
            node={node}
            indexedIds={indexedSet}
            onFolderOpen={onFolderOpen}
            onDeIndexRequest={onDeIndexRequest}
            isDeIndexPending={isDeIndexPending}
          />
        ))}
      </tbody>
    </table>
  );
}
