import type { SortOrder } from "@/domain/types";
import type { StatusFilter, TypeFilter } from "@/domain/types";

const VALID_STATUS: readonly StatusFilter[] = [
  "all",
  "indexed",
  "not-indexed",
] as const;

const VALID_TYPE: readonly TypeFilter[] = [
  "all",
  "folder",
  "file",
  "pdf",
  "csv",
  "txt",
] as const;

const VALID_SORT_ORDER: readonly SortOrder[] = ["asc", "desc"] as const;

export function parseStatusUseCase(value: string | null): StatusFilter {
  if (value && (VALID_STATUS as readonly string[]).includes(value)) {
    return value as StatusFilter;
  }
  return "all";
}

export function parseTypeUseCase(value: string | null): TypeFilter {
  if (value && (VALID_TYPE as readonly string[]).includes(value)) {
    return value as TypeFilter;
  }
  return "all";
}

export function parseSortOrderUseCase(value: string | null): SortOrder {
  if (value && (VALID_SORT_ORDER as readonly string[]).includes(value)) {
    return value as SortOrder;
  }
  return "asc";
}
