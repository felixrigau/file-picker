"use client";

import {
  useActiveKnowledgeBaseId,
  useGDriveFiles,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks";
import { getGDriveQueryOptions } from "@/hooks/use-gdrive-files";
import { queryKeys } from "@/hooks/query-keys";
import { cn } from "@/lib/utils";
import { applyFilters } from "@/lib/utils/filter-files";
import { sortFiles } from "@/lib/utils/sort-files";
import type { FileNode, StatusFilter, TypeFilter } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DisplayRow } from "./FileTable";
import { FileTable } from "./FileTable";
import { FilterPills } from "./FilterPills";

/** Single breadcrumb segment: id for navigation, name for display */
interface BreadcrumbSegment {
  id: string;
  name: string;
}

/** Fixed shell height (80vh) to prevent layout jumps when content changes */
const SHELL_HEIGHT = "h-[80vh]";

type SortOrder = "asc" | "desc";

const SORT_ORDER_PARAM = "sortOrder";
const STATUS_PARAM = "status";
const TYPE_PARAM = "type";

const VALID_STATUS: StatusFilter[] = ["all", "indexed", "not-indexed"];
const VALID_TYPE: TypeFilter[] = ["all", "folder", "file", "pdf", "csv", "txt"];

function parseStatus(value: string | null): StatusFilter {
  if (value && VALID_STATUS.includes(value as StatusFilter)) {
    return value as StatusFilter;
  }
  return "all";
}

function parseType(value: string | null): TypeFilter {
  if (value && VALID_TYPE.includes(value as TypeFilter)) {
    return value as TypeFilter;
  }
  return "all";
}

export function FilePickerShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortOrder = (searchParams.get(SORT_ORDER_PARAM) as SortOrder) ?? "asc";
  const statusFilter = parseStatus(searchParams.get(STATUS_PARAM));
  const typeFilter = parseType(searchParams.get(TYPE_PARAM));

  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbSegment[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [childData, setChildData] = useState<Map<string, FileNode[]>>(new Map());
  const [, startTransition] = useTransition();
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

  /**
   * Navigates to a folder (or root when id is undefined).
   * Clears search filters on navigation.
   * When displayName is provided, appends to breadcrumb path (table navigation).
   * When navigating via breadcrumb click, truncates path to the clicked segment.
   */
  const mapsTo = useCallback(
    (id: string | undefined, displayName?: string) => {
      setSearchFilter("");
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
    [breadcrumbPath],
  );

  const filteredResources = useMemo(
    () =>
      applyFilters(data?.data ?? [], {
        searchQuery: searchFilter,
        status: statusFilter,
        type: typeFilter,
        indexedIds,
      }),
    [data?.data, searchFilter, statusFilter, typeFilter, indexedIds],
  );

  const updateUrlParams = useCallback(
    (updates: { status?: StatusFilter; type?: TypeFilter }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (updates.status !== undefined) {
        if (updates.status === "all") params.delete(STATUS_PARAM);
        else params.set(STATUS_PARAM, updates.status);
      }
      if (updates.type !== undefined) {
        if (updates.type === "all") params.delete(TYPE_PARAM);
        else params.set(TYPE_PARAM, updates.type);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handleStatusChange = useCallback(
    (status: StatusFilter) => {
      startTransition(() => updateUrlParams({ status }));
    },
    [updateUrlParams],
  );

  const handleTypeChange = useCallback(
    (type: TypeFilter) => {
      startTransition(() => updateUrlParams({ type }));
    },
    [updateUrlParams],
  );

  const handleClearFilters = useCallback(() => {
    startTransition(() => {
      setSearchFilter("");
      const params = new URLSearchParams(searchParams.toString());
      params.delete(STATUS_PARAM);
      params.delete(TYPE_PARAM);
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [searchParams, router]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    searchFilter.trim() !== "";

  const sortedResources = useMemo(
    () => sortFiles(filteredResources, sortOrder),
    [filteredResources, sortOrder],
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
      const cached = queryClient.getQueryData<{ data: FileNode[] }>(
        queryKeys.gdrive(id),
      );
      if (cached?.data) {
        results.push({ id, data: cached.data });
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
          .then((r) => ({ id, data: r.data })),
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
            addNodes(sortFiles(children, sortOrder), depth + 1);
          } else {
            for (let i = 0; i < 3; i++) {
              rows.push({ type: "skeleton", folderId: node.id, depth: depth + 1, index: i });
            }
          }
        }
      }
    }

    addNodes(sortedResources, 0);
    return rows;
  }, [sortedResources, expandedIds, childData, sortOrder]);

  const handleSortToggle = useCallback(() => {
    startTransition(() => {
      const next = sortOrder === "asc" ? "desc" : "asc";
      const params = new URLSearchParams(searchParams.toString());
      params.set(SORT_ORDER_PARAM, next);
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, [sortOrder, searchParams, router]);

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
        const ids = deIndexFolder.variables?.items?.map((i) => i.resourceId) ?? [];
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
          <FilterPills
            status={statusFilter}
            type={typeFilter}
            onStatusChange={handleStatusChange}
            onTypeChange={handleTypeChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
        <input
          type="search"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search by..."
          className="w-2/5 min-w-32 shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Scrollable area — fills remaining height, prevents CLS when content changes */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          {isMissingEnv ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
            <p className="font-medium">Environment variables not configured</p>
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
            sortOrder={sortOrder}
            onSortToggle={handleSortToggle}
            emptyMessage={
              (data?.data?.length ?? 0) === 0
                ? "No files or folders"
                : "No files found"
            }
            onResetFilters={hasActiveFilters ? handleClearFilters : undefined}
          />
        )}
        </div>
      </div>
    </div>
  );
}
