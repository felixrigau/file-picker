import type { SortOrder } from "@/utils/sort-files";
import type { StatusFilter, TypeFilter } from "@/domain/types";

export const SORT_ORDER_PARAM = "sortOrder";
export const STATUS_PARAM = "status";
export const TYPE_PARAM = "type";

export const VALID_STATUS: readonly StatusFilter[] = [
  "all",
  "indexed",
  "not-indexed",
] as const;

export const VALID_TYPE: readonly TypeFilter[] = [
  "all",
  "folder",
  "file",
  "pdf",
  "csv",
  "txt",
] as const;

export const VALID_SORT_ORDER: readonly SortOrder[] = ["asc", "desc"] as const;

export const DEFAULT_STATUS: StatusFilter = "all";
export const DEFAULT_TYPE: TypeFilter = "all";
export const DEFAULT_SORT_ORDER: SortOrder = "asc";
