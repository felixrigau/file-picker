import type { FileNode } from "@/domain/types";
import type { DisplayRow } from "@/components/file-table";
import { sortFilesUseCase } from "@/domain/use-cases";
import type { SortOrder } from "@/domain/types";
import { SKELETON_ROWS_PER_FOLDER } from "./constants";

export function buildDisplayRows(
  nodes: FileNode[],
  depth: number,
  expandedIds: Set<string>,
  childData: Map<string, FileNode[]>,
  sortOrder: SortOrder,
): DisplayRow[] {
  const rows: DisplayRow[] = [];

  for (const node of nodes) {
    rows.push({ type: "resource", node, depth });

    if (node.type === "folder" && expandedIds.has(node.id)) {
      const children = childData.get(node.id);

      if (children) {
        const sortedChildren = sortFilesUseCase(children, sortOrder);
        rows.push(
          ...buildDisplayRows(
            sortedChildren,
            depth + 1,
            expandedIds,
            childData,
            sortOrder,
          ),
        );
      } else {
        for (let i = 0; i < SKELETON_ROWS_PER_FOLDER; i++) {
          rows.push({
            type: "skeleton",
            folderId: node.id,
            depth: depth + 1,
            index: i,
          });
        }
      }
    }
  }

  return rows;
}
