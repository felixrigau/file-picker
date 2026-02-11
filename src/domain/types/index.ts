/**
 * Domain types — UI models and filters.
 * Used by components, hooks, and utils.
 */

/** Status filter: indexed state relative to Knowledge Base */
export type StatusFilter = "all" | "indexed" | "not-indexed";

/** Type filter: folders, files, or extension */
export type TypeFilter = "all" | "folder" | "file" | "pdf" | "csv" | "txt";

/** File or folder node in the file picker tree. */
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  updatedAt: string;
  size?: number;
  isIndexed: boolean;
  parentId?: string;
  /** Path for de-index API (from inode_path.path) */
  resourcePath?: string;
}

/** List of file nodes (e.g. from a folder or search result). */
export interface FileNodeList {
  files: FileNode[];
}

/** Paginated list of file nodes. camelCase for View consumption. */
export interface PaginatedFileNodes {
  items: FileNode[];
  nextCursor: string | null;
  currentCursor: string | null;
}

/** Sort direction: ascending (A-Z) or descending (Z-A) */
export type SortOrder = "asc" | "desc";

/** Parameters for composing all filters in a single call */
export interface ApplyFiltersParams {
  searchQuery: string;
  status: StatusFilter;
  type: TypeFilter;
  indexedIds: Set<string>;
}

/** Result of indexing validation */
export interface IndexValidationResult {
  success: boolean;
  error?: string;
}
