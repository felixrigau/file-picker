import {
  CELL_PADDING_LEFT_PX,
  TREE_INDENT_BASE_PX,
  TREE_INDENT_PER_LEVEL_PX,
} from "./constants";

/**
 * Extracts file extension from filename (lowercase).
 * e.g. "Document.PDF" → "pdf"
 */
export function getFileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext;
}

/** Computes left padding in px for tree row based on depth */
export function getTreeIndentPaddingPx(depth: number): number {
  return TREE_INDENT_BASE_PX + depth * TREE_INDENT_PER_LEVEL_PX;
}

/** Total left padding for name cell = cell padding + tree indent */
export function getNameCellPaddingLeftPx(depth: number): number {
  return CELL_PADDING_LEFT_PX + getTreeIndentPaddingPx(depth);
}
