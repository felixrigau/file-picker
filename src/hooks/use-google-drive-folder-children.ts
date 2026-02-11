"use client";

import type { FileNode, PaginatedFileNodes } from "@/domain/types";
import { queryKeys } from "@/hooks/utils/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { getGoogleDriveQueryOptions } from "./use-google-drive-files";

const PREFETCH_DELAY_MS = 150;
const PREFETCH_CANCEL_DEBOUNCE_MS = 80;

/**
 * Fetches and caches children for expanded folders. TanStack Query layer only.
 * Returns childData Map, prefetch and cancel for hover behavior.
 */
export function useGoogleDriveFolderChildren(expandedIds: Set<string>): {
  childData: Map<string, FileNode[]>;
  prefetch: (folderId: string) => void;
  cancelPrefetch: (folderId: string) => void;
} {
  const queryClient = useQueryClient();
  const [childData, setChildData] = useState<Map<string, FileNode[]>>(
    new Map(),
  );
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredFolderIdRef = useRef<string | null>(null);
  const expandedIdsRef = useRef(expandedIds);

  useEffect(() => {
    expandedIdsRef.current = expandedIds;
  }, [expandedIds]);

  useEffect(() => {
    const toFetch = [...expandedIds].filter((id) => !childData.has(id));
    if (toFetch.length === 0) return;

    const cachedResults: { id: string; data: FileNode[] }[] = [];
    const idsToFetch: string[] = [];

    for (const id of toFetch) {
      const cached = queryClient.getQueryData<PaginatedFileNodes>(
        queryKeys.googleDrive(id),
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
          .fetchQuery(getGoogleDriveQueryOptions(id))
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

  const prefetch = useCallback(
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
        queryClient.prefetchQuery(getGoogleDriveQueryOptions(folderId));
      }, PREFETCH_DELAY_MS);
    },
    [queryClient],
  );

  const cancelPrefetch = useCallback(
    (folderId: string) => {
      hoveredFolderIdRef.current = null;

      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
        prefetchTimerRef.current = null;
      }

      cancelTimerRef.current = setTimeout(() => {
        cancelTimerRef.current = null;
        if (expandedIdsRef.current.has(folderId)) return;
        queryClient.cancelQueries({
          queryKey: queryKeys.googleDrive(folderId),
        });
      }, PREFETCH_CANCEL_DEBOUNCE_MS);
    },
    [queryClient],
  );

  return { childData, prefetch, cancelPrefetch };
}
