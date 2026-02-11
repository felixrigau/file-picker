"use client";

import { useGDriveFiles, useIndexedResourceIds } from "@/hooks";
import { useFileActions } from "./hooks/actions";
import { useFileFilters, useFileTree } from "./hooks/data";
import {
  FilePickerBreadcrumbs,
  FilePickerContentContainer,
  FilePickerError,
  FilePickerLayout,
  FilePickerSearch,
} from "./components";
import { FileTable } from "@/components/file-table";
import { FilterBar } from "@/components/filter-bar";
import { useMemo, useState } from "react";

export function FilePickerShell() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );

  const { data, isLoading, isError, error, refetch } =
    useGDriveFiles(currentFolderId);
  const indexedIdsRaw = useIndexedResourceIds();
  const indexedIds = useMemo(() => new Set(indexedIdsRaw), [indexedIdsRaw]);

  const filter = useFileFilters({
    rawItems: data?.items ?? [],
    indexedIds,
  });

  const tree = useFileTree({
    sortedResources: filter.data.processedResources,
    sortOrder: filter.data.sortOrder,
    onCurrentFolderChange: setCurrentFolderId,
    onNavigateStart: () => filter.action.setSearch(""),
  });

  const indexing = useFileActions({
    isError,
    error: error instanceof Error ? error : null,
    onRefetch: refetch,
  });

  const emptyMessage =
    (data?.items?.length ?? 0) === 0
      ? "No files or folders"
      : "No files found";

  const hasError = indexing.data.isMissingEnv || indexing.data.hasGenericError;

  return (
    <FilePickerLayout>
      <FilePickerBreadcrumbs
        breadcrumbPath={tree.data.breadcrumbPath}
        onNavigate={tree.action.mapsTo}
      />

      <div className="flex shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <FilterBar
            status={filter.data.status}
            type={filter.data.type}
            onStatusChange={filter.action.updateStatus}
            onTypeChange={filter.action.updateType}
            onClearFilters={filter.action.clearFilters}
            hasActiveFilters={filter.data.hasActiveFilters}
          />
        </div>
        <FilePickerSearch
          value={filter.data.search}
          onChange={filter.action.setSearch}
        />
      </div>

      <FilePickerContentContainer>
        {hasError ? (
          <FilePickerError
            variant={
              indexing.data.isMissingEnv ? "missingEnv" : "generic"
            }
            message={indexing.data.errorMessage}
            onRetry={indexing.action.refetch}
          />
        ) : (
          <FileTable
            resources={tree.data.displayedResources}
            isLoading={isLoading}
            onFolderHover={tree.action.onFolderHover}
            onFolderHoverCancel={tree.action.onFolderHoverCancel}
            onFolderToggle={tree.action.onFolderToggle}
            expandedIds={tree.data.expandedIds}
            indexedIds={indexedIdsRaw}
            onIndexRequest={indexing.action.handleIndex}
            onDeIndexRequest={indexing.action.handleDeIndex}
            isIndexPending={indexing.data.isIndexPending}
            isDeIndexPending={indexing.data.isDeIndexPending}
            sortOrder={filter.data.sortOrder}
            onSortToggle={filter.action.toggleSort}
            emptyMessage={emptyMessage}
            onResetFilters={
              filter.data.hasActiveFilters ? filter.action.clearFilters : undefined
            }
          />
        )}
      </FilePickerContentContainer>
    </FilePickerLayout>
  );
}
