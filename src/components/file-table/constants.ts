/** Number of skeleton rows shown during initial load */
export const SKELETON_ROW_COUNT = 6;

/** Min height for table content area — matches skeleton height to prevent CLS when empty */
export const TABLE_CONTENT_MIN_HEIGHT = "min-h-[21rem]";

/** Base left padding for table cells (matches Tailwind px-4 / 1rem) */
export const CELL_PADDING_LEFT_PX = 16;

/** Base indent (px) for tree rows */
export const TREE_INDENT_BASE_PX = 12;

/** Indent per depth level (px) */
export const TREE_INDENT_PER_LEVEL_PX = 16;

/**
 * Fixed widths for Status and Actions columns to prevent layout shift.
 * Uses rem for consistency with design; prevents CLS when content changes.
 */
export const STATUS_COLUMN_WIDTH = "w-28 min-w-28";
export const ACTIONS_COLUMN_WIDTH = "w-[6.5rem] min-w-[6.5rem]";

/** Minimum height for table row content (prevents CLS) */
export const ROW_CONTENT_MIN_HEIGHT = "min-h-8";
