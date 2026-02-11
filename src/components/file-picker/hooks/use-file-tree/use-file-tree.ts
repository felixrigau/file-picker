"use client";

import type { FileNode, PaginatedFileNodes } from "@/domain/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getGDriveQueryOptions } from "@/hooks/use-gdrive-files";
import { queryKeys } from "@/hooks/query-keys";
import type {
  BreadcrumbSegment,
  UseFileTreeParams,
  UseFileTreeResult,
} from "./types";
import { PREFETCH_CANCEL_DEBOUNCE_MS, PREFETCH_DELAY_MS } from "./constants";
import { buildDisplayRows } from "./utils";

export function useFileTree({
  sortedResources,
  sortOrder,
  onCurrentFolderChange,
  onNavigateStart,
}: UseFileTreeParams): UseFileTreeResult {
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

  useEffect(() => {
    expandedIdsRef.current = expandedIds;
  }, [expandedIds]);

  const mapsTo = useCallback(
    (id: string | undefined, displayName?: string) => {
      onNavigateStart?.();
      setExpandedIds(new Set());
      setChildData(new Map());

      if (id === undefined) {
        onCurrentFolderChange(undefined);
        setBreadcrumbPath([]);
        return;
      }

      const existingIndex = breadcrumbPath.findIndex((s) => s.id === id);

      if (existingIndex >= 0) {
        const newPath = breadcrumbPath.slice(0, existingIndex + 1);
        setBreadcrumbPath(newPath);
        onCurrentFolderChange(id);
      } else {
        setBreadcrumbPath((prev) => [...prev, { id, name: displayName ?? id }]);
        onCurrentFolderChange(id);
      }
    },
    [breadcrumbPath, onCurrentFolderChange, onNavigateStart],
  );

  const onFolderToggle = useCallback((folderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  useEffect(() => {
    const toFetch = [...expandedIds].filter((id) => !childData.has(id));
    if (toFetch.length === 0) return;

    const cachedResults: { id: string; data: FileNode[] }[] = [];
    const idsToFetch: string[] = [];

    for (const id of toFetch) {
      const cached = queryClient.getQueryData<PaginatedFileNodes>(
        queryKeys.gdrive(id),
      );
      if (cached?.items) {
        cachedResults.push({ id, data: cached.items });
      } else {
        idsToFetch.push(id);
      }
    }

    if (cachedResults.length > 0) {
      queueMicrotask(() => {
        setChildData((prev) => {
          const next = new Map(prev);
          for (const { id, data } of cachedResults) {
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

  const displayedResources = useMemo(
    () =>
      buildDisplayRows(
        sortedResources,
        0,
        expandedIds,
        childData,
        sortOrder,
      ),
    [sortedResources, expandedIds, childData, sortOrder],
  );

  const onFolderHover = useCallback(
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

  const onFolderHoverCancel = useCallback(
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

  return {
    data: {
      displayedResources,
      expandedIds,
      breadcrumbPath,
    },
    action: {
      mapsTo,
      onFolderToggle,
      onFolderHover,
      onFolderHoverCancel,
    },
  };
}
