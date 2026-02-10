import type {
  FileNode,
  StatusFilter,
  TypeFilter,
} from "@/types/domain";

/**
 * Extracts the file extension from a filename (e.g. "report.pdf" → "pdf").
 * Returns lowercase. Returns the last segment after a dot; "file" with no dot returns "file".
 *
 * @param filename - The file or folder name
 * @returns The extension in lowercase, or empty string if none
 * @internal
 */
function extractFileExtension(filename: string): string {
  const lastSegment = filename.split(".").pop()?.toLowerCase();
  return lastSegment ?? "";
}

/**
 * Filters file nodes by name using a case-insensitive substring match.
 * Returns the full list when the search query is empty or only whitespace.
 *
 * @param files - List of FileNode to filter
 * @param searchQuery - Search term (trimmed automatically; matching is case-insensitive)
 * @returns Filtered list where each node's name contains the query
 */
export function filterFilesByName(
  files: FileNode[],
  searchQuery: string,
): FileNode[] {
  const trimmedQuery = searchQuery.trim();
  if (!trimmedQuery) return files;

  const normalizedSearchTerm = trimmedQuery.toLowerCase();
  return files.filter((node) =>
    node.name.toLowerCase().includes(normalizedSearchTerm),
  );
}

/**
 * Filters file nodes by their indexed status in the Knowledge Base.
 * Combines `node.isIndexed` with `indexedIds` to support optimistic updates.
 *
 * @param files - List of FileNode to filter
 * @param status - Filter mode: "all" (no filter), "indexed", or "not-indexed"
 * @param indexedIds - Set of resource IDs considered indexed (from cache + API)
 * @returns Filtered list matching the status criteria
 */
export function filterFilesByStatus(
  files: FileNode[],
  status: StatusFilter,
  indexedIds: Set<string>,
): FileNode[] {
  if (status === "all") return files;

  const showIndexedOnly = status === "indexed";
  return files.filter((node) => {
    const isIndexed = node.isIndexed || indexedIds.has(node.id);
    return showIndexedOnly ? isIndexed : !isIndexed;
  });
}

/**
 * Filters file nodes by type: folder, file, or a specific file extension.
 *
 * @param files - List of FileNode to filter
 * @param type - Filter mode: "all", "folder", "file", or extension ("pdf" | "csv" | "txt")
 * @returns Filtered list matching the type criteria
 */
export function filterFilesByType(
  files: FileNode[],
  type: TypeFilter,
): FileNode[] {
  if (type === "all") return files;
  if (type === "folder") {
    return files.filter((node) => node.type === "folder");
  }
  if (type === "file") {
    return files.filter((node) => node.type === "file");
  }

  const extensionFilter = type;
  return files.filter(
    (node) =>
      node.type === "file" &&
      extractFileExtension(node.name) === extensionFilter,
  );
}

/**
 * Parameters for composing all filters in a single call.
 *
 * @property searchQuery - Text to match against file/folder names (case-insensitive)
 * @property status - Filter by indexed state: "all" | "indexed" | "not-indexed"
 * @property type - Filter by type: "all" | "folder" | "file" | "pdf" | "csv" | "txt"
 * @property indexedIds - Set of resource IDs considered indexed
 */
export interface ApplyFiltersParams {
  searchQuery: string;
  status: StatusFilter;
  type: TypeFilter;
  indexedIds: Set<string>;
}

/**
 * Applies all filters in sequence with AND logic.
 * Order: name search → status → type.
 *
 * @param files - List of FileNode to filter
 * @param params - Filter parameters
 * @returns Filtered list matching all criteria
 */
export function applyFilters(
  files: FileNode[],
  params: ApplyFiltersParams,
): FileNode[] {
  const afterNameFilter = filterFilesByName(files, params.searchQuery);
  const afterStatusFilter = filterFilesByStatus(
    afterNameFilter,
    params.status,
    params.indexedIds,
  );
  return filterFilesByType(afterStatusFilter, params.type);
}
