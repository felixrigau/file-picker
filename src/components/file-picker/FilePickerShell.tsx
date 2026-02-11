"use client";

import {
  useActiveKnowledgeBaseId,
  useGDriveFiles,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks";
import { useFileFilters } from "./hooks/use-file-filters";
import { getGDriveQueryOptions } from "@/hooks/use-gdrive-files";
import { queryKeys } from "@/hooks/query-keys";
import { cn } from "@/view/utils";
import { sortFiles } from "@/utils/sort-files";
import type { FileNode, PaginatedFileNodes } from "@/domain/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileTable, type DisplayRow } from "@/components/file-table";
import { FilterBar } from "@/components/filter-bar";

/** Single breadcrumb segment: id for navigation, name for display */
interface BreadcrumbSegment {
  id: string;
  name: string;
}

/** Fixed shell height (80vh) to prevent layout jumps when content changes */
const SHELL_HEIGHT = "h-[80vh]";

export function FilePickerShell() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbSegment[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [childData, setChildData] = useState<Map<string, FileNode[]>>(
    new Map(),
  );
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredFolderIdRef = useRef<string | null>(null);
  const expandedIdsRef = useRef<Set<string>>(expandedIds);

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

  const mapsTo = useCallback(
    (id: string | undefined, displayName?: string) => {
      actions.setSearch("");
      setExpandedIds(new Set());
      setChildData(new Map());

      if (id === undefined) {
        setCurrentFolderId(undefined);
        setBreadcrumbPath([]);
        return;
      }

      const existingIndex = breadcrumbPath.findIndex((s) => s.id === id);
      if (existingIndex >= 0) {
        setCurrentFolderId(id);
        setBreadcrumbPath(breadcrumbPath.slice(0, existingIndex + 1));
      } else {
        setCurrentFolderId(id);
        setBreadcrumbPath((prev) => [...prev, { id, name: displayName ?? id }]);
      }
    },
    [breadcrumbPath, actions],
  );

  const handleFolderToggle = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  useEffect(() => {
    expandedIdsRef.current = expandedIds;
  }, [expandedIds]);

  useEffect(() => {
    const toFetch = [...expandedIds].filter((id) => !childData.has(id));
    if (toFetch.length === 0) return;

    const results: { id: string; data: FileNode[] }[] = [];
    const idsToFetch: string[] = [];

    for (const id of toFetch) {
      const cached = queryClient.getQueryData<PaginatedFileNodes>(
        queryKeys.gdrive(id),
      );
      if (cached?.items) {
        results.push({ id, data: cached.items });
      } else {
        idsToFetch.push(id);
      }
    }

    if (results.length > 0) {
      queueMicrotask(() => {
        setChildData((prev) => {
          const next = new Map(prev);
          for (const { id, data } of results) {
            next.set(id, data);
          }
          return next;
        });
      });
    }

    if (idsToFetch.length === 0) return;

    let cancelled = false;
    Promise.allSettled(
      idsToFetch.map((id) =>
        queryClient
          .fetchQuery(getGDriveQueryOptions(id))
          .then((r) => ({ id, data: r.items })),
      ),
    ).then((settledResults) => {
      if (cancelled) return;
      const fetchedResults = settledResults
        .filter(
          (r): r is PromiseFulfilledResult<{ id: string; data: FileNode[] }> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value);
      if (fetchedResults.length === 0) return;
      setChildData((prev) => {
        const next = new Map(prev);
        for (const { id, data } of fetchedResults) {
          next.set(id, data);
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [expandedIds, childData, queryClient]);

  const displayedResources = useMemo((): DisplayRow[] => {
    const rows: DisplayRow[] = [];

    function addNodes(nodes: FileNode[], depth: number) {
      for (const node of nodes) {
        rows.push({ type: "resource", node, depth });
        if (node.type === "folder" && expandedIds.has(node.id)) {
          const children = childData.get(node.id);
          if (children) {
            addNodes(sortFiles(children, filters.sortOrder), depth + 1);
          } else {
            for (let i = 0; i < 3; i++) {
              rows.push({
                type: "skeleton",
                folderId: node.id,
                depth: depth + 1,
                index: i,
              });
            }
          }
        }
      }
    }

    addNodes(processedResources, 0);
    return rows;
  }, [processedResources, expandedIds, childData, filters.sortOrder]);

  /** Delay before prefetch to avoid requests when cursor is just passing through */
  const PREFETCH_DELAY_MS = 150;
  /** Delay before cancelling prefetch — prevents spurious cancels from mouse jitter */
  const PREFETCH_CANCEL_DEBOUNCE_MS = 80;

  const handleFolderHover = useCallback(
    (folderId: string) => {
      hoveredFolderIdRef.current = folderId;

      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }

      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = setTimeout(() => {
        prefetchTimerRef.current = null;
        if (hoveredFolderIdRef.current !== folderId) return;
        queryClient.prefetchQuery(getGDriveQueryOptions(folderId));
      }, PREFETCH_DELAY_MS);
    },
    [queryClient],
  );

  const handleFolderHoverCancel = useCallback(
    (folderId: string) => {
      hoveredFolderIdRef.current = null;

      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
        prefetchTimerRef.current = null;
      }

      cancelTimerRef.current = setTimeout(() => {
        cancelTimerRef.current = null;
        if (expandedIdsRef.current.has(folderId)) return;
        queryClient.cancelQueries({ queryKey: queryKeys.gdrive(folderId) });
      }, PREFETCH_CANCEL_DEBOUNCE_MS);
    },
    [queryClient],
  );

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
          onClick={() => mapsTo(undefined)}
          className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Root
        </button>
        {breadcrumbPath.map((segment) => (
          <span key={segment.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => mapsTo(segment.id)}
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
              resources={displayedResources}
              isLoading={isLoading}
              onFolderHover={handleFolderHover}
              onFolderHoverCancel={handleFolderHoverCancel}
              onFolderToggle={handleFolderToggle}
              expandedIds={expandedIds}
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
