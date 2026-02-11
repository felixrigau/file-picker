import type { SortOrder } from "@/domain/types";
import type { FileNode } from "@/domain/types";

const LOCALE_COLLATOR_OPTIONS: Intl.CollatorOptions = {
  numeric: true,
  sensitivity: "base",
};

export function sortFilesUseCase(
  files: FileNode[],
  sortOrder: SortOrder,
): FileNode[] {
  const isAscending = sortOrder === "asc";

  return [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    const cmp = a.name.localeCompare(
      b.name,
      undefined,
      LOCALE_COLLATOR_OPTIONS,
    );
    return isAscending ? cmp : -cmp;
  });
}
