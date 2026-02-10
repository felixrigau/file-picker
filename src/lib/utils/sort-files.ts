import type { FileNode } from "@/types";

export type SortOrder = "asc" | "desc";

const LOCALE_COMPARE_OPTS: Intl.CollatorOptions = {
  numeric: true,
  sensitivity: "base",
};

/**
 * Pure function: sorts files/folders by name.
 * Folders always appear first (Finder/Explorer behavior).
 * Uses localeCompare for proper alphanumeric order (archivo10 after archivo2)
 * and accent/case insensitivity.
 */
export function sortFiles(
  files: FileNode[],
  sortOrder: SortOrder
): FileNode[] {
  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    const cmp = a.name.localeCompare(b.name, undefined, LOCALE_COMPARE_OPTS);
    return sortOrder === "asc" ? cmp : -cmp;
  });
  return sorted;
}
