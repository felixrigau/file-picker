import type {
  FileNode,
  StatusFilter,
  TypeFilter,
} from "@/types";

/**
 * Pure function: filters files/folders by name.
 * Case-insensitive. Returns all items when searchQuery is empty or only whitespace.
 *
 * @param files - List of FileNode to filter
 * @param searchQuery - Search term (trimmed, case-insensitive match)
 * @returns Filtered list where node.name includes the query
 */
export function filterFilesByName(
  files: FileNode[],
  searchQuery: string,
): FileNode[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return files;

  const q = trimmed.toLowerCase();
  return files.filter((node) => node.name.toLowerCase().includes(q));
}

/**
 * Pure function: filters files by indexed status.
 *
 * @param files - List of FileNode to filter
 * @param status - "all" | "indexed" | "not-indexed"
 * @param indexedIds - Set of resource ids considered indexed (optimistic + API)
 */
export function filterFilesByStatus(
  files: FileNode[],
  status: StatusFilter,
  indexedIds: Set<string>,
): FileNode[] {
  if (status === "all") return files;
  return files.filter((node) => {
    const isIndexed = node.isIndexed || indexedIds.has(node.id);
    return status === "indexed" ? isIndexed : !isIndexed;
  });
}

function getFileExtension(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ext;
}

/**
 * Pure function: filters files by type (folder, file, or extension).
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
  const ext = type;
  return files.filter(
    (node) => node.type === "file" && getFileExtension(node.name) === ext,
  );
}

/** Params for applyFilters */
export interface ApplyFiltersParams {
  searchQuery: string;
  status: StatusFilter;
  type: TypeFilter;
  indexedIds: Set<string>;
}

/**
 * Composes all filters with AND. Order: name → status → type.
 */
export function applyFilters(
  files: FileNode[],
  params: ApplyFiltersParams,
): FileNode[] {
  let result = filterFilesByName(files, params.searchQuery);
  result = filterFilesByStatus(result, params.status, params.indexedIds);
  result = filterFilesByType(result, params.type);
  return result;
}
