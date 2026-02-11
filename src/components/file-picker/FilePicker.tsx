"use client";

import {
  FilePickerBreadcrumbs,
  FilePickerContentContainer,
  FilePickerError,
  FilePickerLayout,
  FilePickerSearch,
} from "./components";
import type { FilePickerProps } from "./FilePicker.types";
import { FileTable } from "@/components/file-table";
import { FilterBar } from "@/components/filter-bar";
import { useMemo } from "react";
import { useFileFilters, createUseFileTree } from "./hooks";
import { useGDriveFolderChildren } from "@/hooks";

const useFileTree = createUseFileTree(useGDriveFolderChildren);

/**
 * FilePicker — UI logic (filters, tree) is internal. Receives data + actions from container.
 * useFileFilters and useFileTree are pure UI; useFileActions stays in container (data layer).
 */
export function FilePicker({
  rawItems,
  indexedIds,
  isLoading,
  hasError,
  errorMessage,
  onIndexRequest,
  onDeIndexRequest,
  isIndexPending,
  isDeIndexPending,
  onRefetch,
  onCurrentFolderChange,
}: FilePickerProps) {
  const indexedIdsSet = useMemo(() => new Set(indexedIds), [indexedIds]);

  const filter = useFileFilters({
    rawItems,
    indexedIds: indexedIdsSet,
  });

  const tree = useFileTree({
    sortedResources: filter.data.processedResources,
    sortOrder: filter.data.sortOrder,
    onCurrentFolderChange,
    onNavigateStart: () => filter.action.setSearch(""),
  });

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
          aria-label="Search files and folders"
        />
      </div>

      <FilePickerContentContainer>
        {hasError ? (
          <FilePickerError message={errorMessage} onRetry={onRefetch} />
        ) : (
          <FileTable
            resources={tree.data.displayedResources}
            isLoading={isLoading}
            onFolderHover={tree.action.onFolderHover}
            onFolderHoverCancel={tree.action.onFolderHoverCancel}
            onFolderToggle={tree.action.onFolderToggle}
            expandedIds={tree.data.expandedIds}
            indexedIds={indexedIds}
            onIndexRequest={onIndexRequest}
            onDeIndexRequest={onDeIndexRequest}
            isIndexPending={isIndexPending}
            isDeIndexPending={isDeIndexPending}
            sortOrder={filter.data.sortOrder}
            onSortToggle={filter.action.toggleSort}
            emptyMessage="No files found"
            onResetFilters={
              filter.data.hasActiveFilters
                ? filter.action.clearFilters
                : undefined
            }
          />
        )}
      </FilePickerContentContainer>
    </FilePickerLayout>
  );
}
