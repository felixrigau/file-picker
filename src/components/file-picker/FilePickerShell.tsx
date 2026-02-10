"use client";

import { getFilesAction } from "@/app/actions/server-actions";
import {
  useActiveKnowledgeBaseId,
  useGDriveFiles,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks";
import { stackAIQueryKeys } from "@/hooks/query-keys";
import { cn } from "@/lib/utils";
import { applyFilters } from "@/lib/utils/filter-files";
import { sortFiles } from "@/lib/utils/sort-files";
import type { FileNode, StatusFilter, TypeFilter } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { DisplayRow } from "./FileTable";
import { FileTable } from "./FileTable";
import { FilterDropdown } from "./FilterDropdown";

/** Single breadcrumb segment: id for navigation, name for display */
interface BreadcrumbSegment {
  id: string;
  name: string;
}

/** Fixed height for the file list container to prevent CLS when data loads */
const CONTAINER_HEIGHT = "min-h-[400px] max-h-[500px]";

type SortOrder = "asc" | "desc";

const SORT_ORDER_PARAM = "sortOrder";
const STATUS_PARAM = "status";
const TYPE_PARAM = "type";

const VALID_STATUS: StatusFilter[] = ["all", "indexed", "not-indexed"];
const VALID_TYPE: TypeFilter[] = ["all", "folder", "file"];

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [childData, setChildData] = useState<Map<string, FileNode[]>>(new Map());
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, error } = useGDriveFiles(currentFolderId);
  const indexedIdsRaw = useIndexedResourceIds();
  const indexedIds = useMemo(() => new Set(indexedIdsRaw), [indexedIdsRaw]);
  const activeKnowledgeBaseId = useActiveKnowledgeBaseId();
  const { indexNode, indexResource, deIndexResource } = useKBActions();

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

  const handleSelectionChange = useCallback((ids: Set<string>) => {
    setSelectedIds(ids);
  }, []);

  useEffect(() => {
    const toFetch = [...expandedIds].filter((id) => !childData.has(id));
    if (toFetch.length === 0) return;
    let cancelled = false;
    Promise.all(
      toFetch.map((id) =>
        queryClient
          .fetchQuery({
            queryKey: stackAIQueryKeys.gdrive(id),
            queryFn: () => getFilesAction(id),
          })
          .then((r) => ({ id, data: r.data })),
      ),
    ).then((results) => {
      if (cancelled) return;
      setChildData((prev) => {
        const next = new Map(prev);
        for (const { id, data } of results) {
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
    for (const node of sortedResources) {
      rows.push({ type: "resource", node, depth: 0 });
      if (node.type === "folder" && expandedIds.has(node.id)) {
        const children = childData.get(node.id);
        if (children) {
          const sortedChildren = sortFiles(children, sortOrder);
          for (const child of sortedChildren) {
            rows.push({ type: "resource", node: child, depth: 1 });
          }
        } else {
          for (let i = 0; i < 3; i++) {
            rows.push({ type: "skeleton", folderId: node.id, depth: 1, index: i });
          }
        }
      }
    }
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

  const handleFolderOpen = useCallback(
    (id: string, name: string) => {
      mapsTo(id, name);
    },
    [mapsTo],
  );

  /** Delay before prefetch to avoid requests when cursor is just passing through */
  const PREFETCH_DELAY_MS = 200;

  const handleFolderHover = useCallback(
    (folderId: string) => {
      if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
      prefetchTimerRef.current = setTimeout(() => {
        prefetchTimerRef.current = null;
        queryClient.prefetchQuery({
          queryKey: stackAIQueryKeys.gdrive(folderId),
          queryFn: () => getFilesAction(folderId),
        });
      }, PREFETCH_DELAY_MS);
    },
    [queryClient],
  );

  const handleFolderHoverCancel = useCallback(
    (folderId: string) => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
        prefetchTimerRef.current = null;
      }
      queryClient.cancelQueries({ queryKey: stackAIQueryKeys.gdrive(folderId) });
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
      deIndexResource.mutate({
        knowledgeBaseId: activeKnowledgeBaseId,
        resourcePath: node.resourcePath,
        resourceId: node.id,
      });
    },
    [activeKnowledgeBaseId, deIndexResource],
  );

  const isIndexPending = useCallback(
    (resourceId: string) =>
      indexResource.isPending &&
      (indexResource.variables?.expandedIds?.includes(resourceId) ?? false),
    [indexResource.isPending, indexResource.variables],
  );

  const isDeIndexPending = useCallback(
    (resourceId: string) =>
      deIndexResource.isPending &&
      deIndexResource.variables?.resourceId === resourceId,
    [deIndexResource.isPending, deIndexResource.variables],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
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

      {/* Search & Filter row — Filter dropdown, Sort, name search */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          status={statusFilter}
          type={typeFilter}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        <input
          type="search"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter by name..."
          className="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Fixed-height scrollable area — prevents CLS when data loads */}
      <div
        className={cn(
          CONTAINER_HEIGHT,
          "overflow-x-auto overflow-y-auto rounded-md border border-border",
        )}
      >
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
          </div>
        ) : (
          <FileTable
            resources={displayedResources}
            isLoading={isLoading}
            onFolderOpen={handleFolderOpen}
            onFolderHover={handleFolderHover}
            onFolderHoverCancel={handleFolderHoverCancel}
            onFolderToggle={handleFolderToggle}
            expandedIds={expandedIds}
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
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
  );
}
