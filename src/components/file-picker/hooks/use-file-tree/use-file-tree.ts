"use client";

import type { BreadcrumbSegment, FileNode } from "@/domain/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UseFileTreeParams, UseFileTreeResult } from "./types";
import { buildDisplayRows } from "./utils";

type UseExpandedChildrenHook = (
  expandedIds: Set<string>,
) => {
  childData: Map<string, FileNode[]>;
  prefetch: (folderId: string) => void;
  cancelPrefetch: (folderId: string) => void;
};

export function createUseFileTree(
  useExpandedChildren: UseExpandedChildrenHook,
) {
  return function useFileTree({
    sortedResources,
    sortOrder,
    onCurrentFolderChange,
    onNavigateStart,
  }: UseFileTreeParams): UseFileTreeResult {
    const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbSegment[]>(
      [],
    );
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const expandedIdsRef = useRef<Set<string>>(expandedIds);

    const { childData, prefetch, cancelPrefetch } =
      useExpandedChildren(expandedIds);

    useEffect(() => {
      expandedIdsRef.current = expandedIds;
    }, [expandedIds]);

    const mapsTo = useCallback(
      (id: string | undefined, displayName?: string) => {
        onNavigateStart?.();
        setExpandedIds(new Set());

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
          setBreadcrumbPath((prev) => [
            ...prev,
            { id, name: displayName ?? id },
          ]);
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
        prefetch(folderId);
      },
      [prefetch],
    );

    const onFolderHoverCancel = useCallback(
      (folderId: string) => {
        cancelPrefetch(folderId);
      },
      [cancelPrefetch],
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
  };
}
