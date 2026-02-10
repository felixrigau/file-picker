import type { FileNode } from "@/types/domain";

/** Sort direction: ascending (A-Z) or descending (Z-A) */
export type SortOrder = "asc" | "desc";

/** Collator options for locale-aware alphanumeric comparison (e.g. archivo2 before archivo10) */
const LOCALE_COLLATOR_OPTIONS: Intl.CollatorOptions = {
  numeric: true,
  sensitivity: "base",
};

/**
 * Sorts file nodes by name with folders always first (Finder/Explorer behavior).
 * Uses localeCompare for proper alphanumeric order and accent/case insensitivity.
 *
 * @param files - List of FileNode to sort (not mutated)
 * @param sortOrder - "asc" (A-Z) or "desc" (Z-A)
 * @returns A new sorted array; folders first, then files, each group sorted by name
 */
export function sortFiles(
  files: FileNode[],
  sortOrder: SortOrder,
): FileNode[] {
  const isAscending = sortOrder === "asc";

  return [...files].sort((a, b) => {
    if (a.type !== b.type) {
      const folderFirst = -1;
      const fileFirst = 1;
      return a.type === "folder" ? folderFirst : fileFirst;
    }

    const nameComparisonResult = a.name.localeCompare(
      b.name,
      undefined,
      LOCALE_COLLATOR_OPTIONS,
    );
    return isAscending ? nameComparisonResult : -nameComparisonResult;
  });
}
