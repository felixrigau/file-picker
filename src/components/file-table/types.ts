import type { FileNode } from "@/domain/types";

/** Sort direction: ascending (A-Z) or descending (Z-A) */
export type SortOrder = "asc" | "desc";

/** Resource row with tree depth for indentation */
export interface ResourceRow {
  node: FileNode;
  depth: number;
}

/** Row to display: resource or skeleton during load */
export type DisplayRow =
  | { type: "resource"; node: FileNode; depth: number }
  | { type: "skeleton"; folderId: string; depth: number; index: number };

export interface FileTableProps {
  resources: DisplayRow[];
  isLoading: boolean;
  onFolderHover?: (folderId: string) => void;
  onFolderHoverCancel?: (folderId: string) => void;
  onFolderToggle?: (folderId: string) => void;
  expandedIds?: Set<string>;
  indexedIds?: string[];
  onIndexRequest?: (node: FileNode) => void;
  onDeIndexRequest?: (node: FileNode) => void;
  isIndexPending?: (resourceId: string) => boolean;
  isDeIndexPending?: (resourceId: string) => boolean;
  sortOrder?: SortOrder;
  onSortToggle?: () => void;
  emptyMessage?: string;
  onResetFilters?: () => void;
}
