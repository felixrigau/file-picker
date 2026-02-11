"use client";

import type { FileNode } from "@/domain/types";
import { useGoogleDriveFiles, useIndexedResourceIds } from "@/hooks";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useFileActions } from "./hooks";
import { FilePicker } from "./FilePicker";

export function FilePickerGoogleDriveContainer() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );
  const [optimisticallyIndexedIds, setOptimisticallyIndexedIds] = useState<
    Set<string>
  >(new Set());
  const [optimisticallyDeIndexedIds, setOptimisticallyDeIndexedIds] = useState<
    Set<string>
  >(new Set());

  const { data, isLoading, isError, error, refetch } =
    useGoogleDriveFiles(currentFolderId);
  const indexedIdsRaw = useIndexedResourceIds();

  const indexing = useFileActions({
    isError,
    error: error instanceof Error ? error : null,
    onRefetch: refetch,
    onIndexError: useCallback((resourceIds: string[]) => {
      setOptimisticallyIndexedIds((prev) => {
        const next = new Set(prev);
        resourceIds.forEach((id) => next.delete(id));
        return next;
      });
    }, []),
    onDeIndexError: useCallback((resourceIds: string[]) => {
      setOptimisticallyDeIndexedIds((prev) => {
        const next = new Set(prev);
        resourceIds.forEach((id) => next.delete(id));
        return next;
      });
    }, []),
  });

  const handleIndexRequest = useCallback(
    (node: FileNode) => {
      flushSync(() => {
        setOptimisticallyIndexedIds((prev) => new Set(prev).add(node.id));
        setOptimisticallyDeIndexedIds((prev) => {
          const next = new Set(prev);
          next.delete(node.id);
          return next;
        });
      });
      indexing.action.handleIndex(node);
    },
    [indexing.action],
  );

  const handleDeIndexRequest = useCallback(
    (node: FileNode) => {
      flushSync(() => {
        setOptimisticallyDeIndexedIds((prev) => new Set(prev).add(node.id));
      });
      indexing.action.handleDeIndex(node);
    },
    [indexing.action],
  );

  const effectiveIndexedIds = useMemo(() => {
    const rawSet = new Set(indexedIdsRaw);
    const extra = Array.from(optimisticallyIndexedIds).filter(
      (id) => !rawSet.has(id),
    );
    return [...indexedIdsRaw, ...extra].filter(
      (id) => !optimisticallyDeIndexedIds.has(id),
    );
  }, [indexedIdsRaw, optimisticallyIndexedIds, optimisticallyDeIndexedIds]);

  return (
    <FilePicker
      rawItems={data?.items ?? []}
      indexedIds={effectiveIndexedIds}
      isLoading={isLoading}
      hasError={indexing.data.hasGenericError}
      errorMessage={indexing.data.errorMessage}
      onIndexRequest={handleIndexRequest}
      onDeIndexRequest={handleDeIndexRequest}
      isIndexPending={indexing.data.isIndexPending}
      isDeIndexPending={indexing.data.isDeIndexPending}
      onRefetch={indexing.action.refetch}
      onCurrentFolderChange={setCurrentFolderId}
    />
  );
}
