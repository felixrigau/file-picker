"use client";

import {
  useActiveKnowledgeBaseId,
  useGDriveFiles,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks";
import { useFileFilters } from "./hooks/use-file-filters";
import { useFileTree } from "./hooks/use-file-tree";
import { cn } from "@/view/utils";
import type { FileNode } from "@/domain/types";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileTable } from "@/components/file-table";
import { FilterBar } from "@/components/filter-bar";

/** Fixed shell height (80vh) to prevent layout jumps when content changes */
const SHELL_HEIGHT = "h-[80vh]";

export function FilePickerShell() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );

  const { data, isLoading, isError, error, refetch } =
    useGDriveFiles(currentFolderId);
  const indexedIdsRaw = useIndexedResourceIds();
  const indexedIds = useMemo(() => new Set(indexedIdsRaw), [indexedIdsRaw]);
  const activeKnowledgeBaseId = useActiveKnowledgeBaseId();

  const {
    processedResources,
    filters,
    actions,
    hasActiveFilters,
  } = useFileFilters({
    rawItems: data?.items ?? [],
    indexedIds,
  });

  const tree = useFileTree({
    sortedResources: processedResources,
    sortOrder: filters.sortOrder,
    onCurrentFolderChange: setCurrentFolderId,
    onNavigateStart: () => actions.setSearch(""),
  });

  const {
    indexNode,
    indexResource,
    deIndexResource,
    deIndexFolder,
    deIndexNode,
  } = useKBActions();

  const isMissingEnv =
    isError &&
    error instanceof Error &&
    error.message.includes("Missing required environment variable");

  const hasGenericError = isError && !isMissingEnv;

  const handleIndexRequest = useCallback(
    (node: FileNode) => {
      indexNode(node);
    },
    [indexNode],
  );

  const handleDeIndexRequest = useCallback(
    (node: FileNode) => {
      if (activeKnowledgeBaseId == null) {
        toast.error("Index a file first to enable remove");
        return;
      }
      if (node.resourcePath == null) {
        toast.error("Cannot remove: missing resource path");
        return;
      }
      deIndexNode(node, activeKnowledgeBaseId);
    },
    [activeKnowledgeBaseId, deIndexNode],
  );

  const isIndexPending = useCallback(
    (resourceId: string) =>
      indexResource.isPending &&
      (indexResource.variables?.expandedIds?.includes(resourceId) ?? false),
    [indexResource.isPending, indexResource.variables],
  );

  const isDeIndexPending = useCallback(
    (resourceId: string) => {
      if (deIndexResource.isPending) {
        return deIndexResource.variables?.resourceId === resourceId;
      }
      if (deIndexFolder.isPending) {
        const ids =
          deIndexFolder.variables?.items?.map((i) => i.resourceId) ?? [];
        return ids.includes(resourceId);
      }
      return false;
    },
    [
      deIndexResource.isPending,
      deIndexResource.variables,
      deIndexFolder.isPending,
      deIndexFolder.variables,
    ],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
        SHELL_HEIGHT,
      )}
    >
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex shrink-0 items-center gap-2 text-sm"
      >
        <button
          type="button"
          onClick={() => tree.mapsTo(undefined)}
          className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Root
        </button>
        {tree.breadcrumbPath.map((segment) => (
          <span key={segment.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => tree.mapsTo(segment.id, segment.name)}
              className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {segment.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Search & Filter row — Pill filters (left, grow), search (right, 40%) */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <FilterBar
            status={filters.status}
            type={filters.type}
            onStatusChange={actions.updateStatus}
            onTypeChange={actions.updateType}
            onClearFilters={actions.clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => actions.setSearch(e.target.value)}
          placeholder="Search by..."
          className="w-2/5 min-w-32 shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Scrollable area — fills remaining height, prevents CLS when content changes */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          {isMissingEnv ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <p className="font-medium">
                Environment variables not configured
              </p>
              <p className="text-sm">
                Copy{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  .env.local.example
                </code>{" "}
                to{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  .env.local
                </code>{" "}
                and fill in{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  NEXT_PUBLIC_STACK_AI_ANON_KEY
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  STACK_AI_EMAIL
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                  STACK_AI_PASSWORD
                </code>
                .
              </p>
            </div>
          ) : hasGenericError ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <p className="font-medium">Error loading files</p>
              <p className="text-sm">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <FileTable
              resources={tree.displayedResources}
              isLoading={isLoading}
              onFolderHover={tree.onFolderHover}
              onFolderHoverCancel={tree.onFolderHoverCancel}
              onFolderToggle={tree.onFolderToggle}
              expandedIds={tree.expandedIds}
              indexedIds={indexedIdsRaw}
              onIndexRequest={handleIndexRequest}
              onDeIndexRequest={handleDeIndexRequest}
              isIndexPending={isIndexPending}
              isDeIndexPending={isDeIndexPending}
              sortOrder={filters.sortOrder}
              onSortToggle={actions.toggleSort}
              emptyMessage={
                (data?.items?.length ?? 0) === 0
                  ? "No files or folders"
                  : "No files found"
              }
              onResetFilters={hasActiveFilters ? actions.clearFilters : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
