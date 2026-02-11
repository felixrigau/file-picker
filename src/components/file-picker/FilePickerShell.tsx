"use client";

import { useGDriveFiles, useIndexedResourceIds } from "@/hooks";
import { useFileActions } from "./hooks/actions";
import { useFileFilters, useFileTree } from "./hooks/data";
import { cn } from "@/view/utils";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

  const filters = useFileFilters({
    rawItems: data?.items ?? [],
    indexedIds,
  });

  const tree = useFileTree({
    sortedResources: filters.data.processedResources,
    sortOrder: filters.data.filters.sortOrder,
    onCurrentFolderChange: setCurrentFolderId,
    onNavigateStart: () => filters.actions.setSearch(""),
  });

  const fileActions = useFileActions({
    isError,
    error: error instanceof Error ? error : null,
    onRefetch: refetch,
  });

  const emptyMessage =
    (data?.items?.length ?? 0) === 0
      ? "No files or folders"
      : "No files found";

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
          onClick={() => tree.actions.mapsTo(undefined)}
          className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Root
        </button>
        {tree.data.breadcrumbPath.map((segment) => (
          <span key={segment.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => tree.actions.mapsTo(segment.id, segment.name)}
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
            status={filters.data.filters.status}
            type={filters.data.filters.type}
            onStatusChange={filters.actions.updateStatus}
            onTypeChange={filters.actions.updateType}
            onClearFilters={filters.actions.clearFilters}
            hasActiveFilters={filters.data.hasActiveFilters}
          />
        </div>
        <input
          type="search"
          value={filters.data.filters.search}
          onChange={(e) => filters.actions.setSearch(e.target.value)}
          placeholder="Search by..."
          className="w-2/5 min-w-32 shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Scrollable area — fills remaining height, prevents CLS when content changes */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          {fileActions.data.isMissingEnv ? (
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
          ) : fileActions.data.hasGenericError ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <p className="font-medium">Error loading files</p>
              <p className="text-sm">{fileActions.data.errorMessage}</p>
              <Button variant="outline" size="sm" onClick={fileActions.actions.refetch}>
                Retry
              </Button>
            </div>
          ) : (
            <FileTable
              resources={tree.data.displayedResources}
              isLoading={isLoading}
              onFolderHover={tree.actions.onFolderHover}
              onFolderHoverCancel={tree.actions.onFolderHoverCancel}
              onFolderToggle={tree.actions.onFolderToggle}
              expandedIds={tree.data.expandedIds}
              indexedIds={indexedIdsRaw}
              onIndexRequest={fileActions.actions.handleIndex}
              onDeIndexRequest={fileActions.actions.handleDeIndex}
              isIndexPending={fileActions.data.isIndexPending}
              isDeIndexPending={fileActions.data.isDeIndexPending}
              sortOrder={filters.data.filters.sortOrder}
              onSortToggle={filters.actions.toggleSort}
              emptyMessage={emptyMessage}
              onResetFilters={filters.data.hasActiveFilters ? filters.actions.clearFilters : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
