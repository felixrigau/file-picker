"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FileNode } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Folder,
  Plus,
  Table,
  Trash2,
} from "lucide-react";
import { memo } from "react";

export type SortOrder = "asc" | "desc";

/** Resource with tree depth for indentation */
export interface ResourceRow {
  node: FileNode;
  depth: number;
}

/** Row to display: resource or skeleton during load */
export type DisplayRow =
  | { type: "resource"; node: FileNode; depth: number }
  | { type: "skeleton"; folderId: string; depth: number; index: number };

interface FileTableProps {
  resources: DisplayRow[];
  isLoading: boolean;
  onFolderOpen: (id: string, name: string) => void;
  onFolderHover?: (folderId: string) => void;
  onFolderHoverCancel?: (folderId: string) => void;
  onFolderToggle?: (folderId: string) => void;
  expandedIds?: Set<string>;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  indexedIds?: string[];
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isIndexPending?: (resourceId: string) => boolean;
  isDeIndexPending?: (resourceId: string) => boolean;
  sortOrder?: SortOrder;
  onSortToggle?: () => void;
  emptyMessage?: string;
  onResetFilters?: () => void;
}

const nameCellClasses = {
  folder: "cursor-pointer font-medium",
  file: "cursor-default",
} as const;

const SKELETON_ROW_COUNT = 6;

const FILE_ICON_MAP: Record<string, { Icon: typeof File; colorClass: string }> = {
  pdf: { Icon: FileText, colorClass: "text-red-500" },
  csv: { Icon: Table, colorClass: "text-green-600" },
  txt: { Icon: FileText, colorClass: "text-sky-500" },
  ds_store: { Icon: File, colorClass: "text-muted-foreground" },
} as const;

const ROW_CONTENT_HEIGHT = "min-h-10";

function FileIcon({ type, name }: { type: "file" | "folder"; name: string }) {
  if (type === "folder") {
    return (
      <span aria-hidden className="shrink-0 text-blue-500">
        <Folder className="size-4" />
      </span>
    );
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const config = FILE_ICON_MAP[ext] ?? { Icon: File, colorClass: "text-muted-foreground" };
  const { Icon, colorClass } = config;
  return (
    <span aria-hidden className={cn("shrink-0", colorClass)}>
      <Icon className="size-4" />
    </span>
  );
}

const FileRow = memo(function FileRow({
  row,
  indexedIds,
  expandedIds,
  selectedIds,
  onFolderOpen,
  onFolderHover,
  onFolderHoverCancel,
  onFolderToggle,
  onSelectionChange,
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
}: {
  row: ResourceRow;
  indexedIds: Set<string>;
  expandedIds?: Set<string>;
  selectedIds?: Set<string>;
  onFolderOpen: (id: string, name: string) => void;
  onFolderHover?: (folderId: string) => void;
  onFolderHoverCancel?: (folderId: string) => void;
  onFolderToggle?: (folderId: string) => void;
  onSelectionChange?: (ids: Set<string>) => void;
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isIndexPending?: (resourceId: string) => boolean;
  isDeIndexPending?: (resourceId: string) => boolean;
}) {
  const { node, depth } = row;
  const isFolder = node.type === "folder";
  const isIndexed = node.isIndexed || indexedIds.has(node.id);
  const canIndex = Boolean(onIndexRequest) && !isIndexed;
  const canDeIndex =
    Boolean(onDeIndexRequest) &&
    isIndexed &&
    Boolean(node.resourcePath);
  const isExpanded = isFolder && expandedIds?.has(node.id);
  const indexPending = isIndexPending?.(node.id) ?? false;
  const deIndexPending = isDeIndexPending?.(node.id) ?? false;
  const actionDisabled = indexPending || deIndexPending;
  const isSelected = selectedIds?.has(node.id) ?? false;

  const handleCheckboxChange = (checked: boolean | "indeterminate") => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (checked === true) next.add(node.id);
    else next.delete(node.id);
    onSelectionChange(next);
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFolderToggle?.(node.id);
  };

  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/50">
      <td className="w-10 px-2 py-2">
        <span className={cn("flex items-center", ROW_CONTENT_HEIGHT)}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            aria-label={`Select ${node.name}`}
          />
        </span>
      </td>
      <td className="px-4 py-2">
        <div
          className={cn(
            "flex w-full items-center gap-2",
            ROW_CONTENT_HEIGHT,
            nameCellClasses[node.type],
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {isFolder ? (
            <span
              className="inline-flex w-fit items-center gap-2"
              onMouseEnter={() => onFolderHover?.(node.id)}
              onMouseLeave={() => onFolderHoverCancel?.(node.id)}
            >
              <button
                type="button"
                onClick={handleChevronClick}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onFolderOpen(node.id, node.name)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <FileIcon type={node.type} name={node.name} />
                <span className="min-w-0 truncate">{node.name}</span>
              </button>
            </span>
          ) : (
            <>
              <span className="w-5 shrink-0" aria-hidden />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <FileIcon type={node.type} name={node.name} />
                <span className="min-w-0 truncate">{node.name}</span>
              </span>
            </>
          )}
        </div>
      </td>
      <td className="w-28 min-w-28 px-4 py-2">
        <span className={cn("inline-flex items-center", ROW_CONTENT_HEIGHT)}>
          {indexPending ? (
            <Badge variant="secondary" className="rounded-md">
              Indexing...
            </Badge>
          ) : deIndexPending ? (
            <Badge variant="secondary" className="rounded-md">
              Removing...
            </Badge>
          ) : isIndexed ? (
            <Badge className="rounded-md bg-green-600/15 text-green-700 hover:bg-green-600/25 dark:bg-green-500/15 dark:text-green-400">
              Indexed
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-md">
              Not indexed
            </Badge>
          )}
        </span>
      </td>
      <td className="w-24 px-4 py-2 text-right">
        <span className={cn("flex items-center justify-end", ROW_CONTENT_HEIGHT)}>
          {canIndex ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onIndexRequest?.(node)}
              disabled={actionDisabled}
              className="h-8 gap-1.5"
            >
              <Plus className="size-4" />
              Index
            </Button>
          ) : canDeIndex ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeIndexRequest?.(node)}
              disabled={actionDisabled}
              className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
              Remove
            </Button>
          ) : null}
        </span>
      </td>
    </tr>
  );
});

function SkeletonRow({ depth }: { depth: number }) {
  return (
    <tr className="border-b border-border/50">
      <td className="w-10 px-2 py-2">
        <Skeleton className="h-10 w-4" />
      </td>
      <td className="px-4 py-2">
        <div
          className={cn("flex items-center gap-2", ROW_CONTENT_HEIGHT)}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="w-5 shrink-0" aria-hidden />
          <Skeleton className="h-10 w-full max-w-48" />
        </div>
      </td>
      <td className="w-28 min-w-28 px-4 py-2">
        <Skeleton className="h-10 w-20" />
      </td>
      <td className="w-24 px-4 py-2">
        <Skeleton className="h-10 w-16" />
      </td>
    </tr>
  );
}

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
  onResetFilters,
  onFolderHover,
  onFolderHoverCancel,
  onFolderToggle,
  expandedIds,
  selectedIds,
  onSelectionChange,
}: FileTableProps) {
  const indexedSet = new Set(indexedIds);
  const SortIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;

  if (isLoading) {
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10 px-2 py-2" aria-hidden />
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="w-28 min-w-28 px-4 py-2 text-left font-medium">Status</th>
            <th className="w-24 px-4 py-2" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="border-b border-border/50">
              <td className="px-2 py-2">
                <Skeleton className="h-10 w-4" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-full max-w-48" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-20" />
              </td>
              <td className="px-4 py-2">
                <Skeleton className="h-10 w-16" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
        <p>{emptyMessage}</p>
        {onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="w-10 px-2 py-2" aria-hidden />
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
          <th className="w-28 min-w-28 px-4 py-2 text-left font-medium">Status</th>
          <th className="w-24 px-4 py-2 text-right font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((row) =>
          row.type === "resource" ? (
            <FileRow
              key={row.node.id}
              row={{ node: row.node, depth: row.depth }}
              indexedIds={indexedSet}
              expandedIds={expandedIds}
              selectedIds={selectedIds}
              onFolderOpen={onFolderOpen}
              onFolderHover={onFolderHover}
              onFolderHoverCancel={onFolderHoverCancel}
              onFolderToggle={onFolderToggle}
              onSelectionChange={onSelectionChange}
              onIndexRequest={onIndexRequest}
              onDeIndexRequest={onDeIndexRequest}
              isIndexPending={isIndexPending}
              isDeIndexPending={isDeIndexPending}
            />
          ) : (
            <SkeletonRow key={`skeleton-${row.folderId}-${row.index}`} depth={row.depth} />
          ),
        )}
      </tbody>
    </table>
  );
}
