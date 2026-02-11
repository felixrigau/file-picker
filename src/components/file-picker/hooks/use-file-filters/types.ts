import type { FileNode, StatusFilter, TypeFilter } from "@/domain/types";
import type { SortOrder } from "@/domain/types";

export interface FileFiltersValues {
  search: string;
  status: StatusFilter;
  type: TypeFilter;
  sortOrder: SortOrder;
}

export interface FileFiltersActions {
  setSearch: (value: string) => void;
  updateStatus: (status: StatusFilter) => void;
  updateType: (type: TypeFilter) => void;
  toggleSort: () => void;
  clearFilters: () => void;
}

export interface UseFileFiltersParams {
  rawItems: FileNode[];
  indexedIds: Set<string>;
}

export interface UseFileFiltersResult {
  data: {
    processedResources: FileNode[];
    search: string;
    status: StatusFilter;
    type: TypeFilter;
    sortOrder: SortOrder;
    hasActiveFilters: boolean;
  };
  action: FileFiltersActions;
}
