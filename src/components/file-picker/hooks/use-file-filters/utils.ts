import type { SortOrder } from "@/utils/sort-files";
import type { StatusFilter, TypeFilter } from "@/domain/types";
import {
  DEFAULT_SORT_ORDER,
  DEFAULT_STATUS,
  DEFAULT_TYPE,
  SORT_ORDER_PARAM,
  STATUS_PARAM,
  TYPE_PARAM,
  VALID_SORT_ORDER,
  VALID_STATUS,
  VALID_TYPE,
} from "./constants";

export function parseStatus(value: string | null): StatusFilter {
  if (value && (VALID_STATUS as readonly string[]).includes(value)) {
    return value as StatusFilter;
  }
  return DEFAULT_STATUS;
}

export function parseType(value: string | null): TypeFilter {
  if (value && (VALID_TYPE as readonly string[]).includes(value)) {
    return value as TypeFilter;
  }
  return DEFAULT_TYPE;
}

export function parseSortOrder(value: string | null): SortOrder {
  if (value && (VALID_SORT_ORDER as readonly string[]).includes(value)) {
    return value as SortOrder;
  }
  return DEFAULT_SORT_ORDER;
}

export function buildUrlParams(
  currentParams: URLSearchParams,
  updates: {
    status?: StatusFilter;
    type?: TypeFilter;
    sortOrder?: SortOrder;
  },
): URLSearchParams {
  const params = new URLSearchParams(currentParams.toString());

  if (updates.status !== undefined) {
    if (updates.status === "all") params.delete(STATUS_PARAM);
    else params.set(STATUS_PARAM, updates.status);
  }
  if (updates.type !== undefined) {
    if (updates.type === "all") params.delete(TYPE_PARAM);
    else params.set(TYPE_PARAM, updates.type);
  }
  if (updates.sortOrder !== undefined) {
    params.set(SORT_ORDER_PARAM, updates.sortOrder);
  }

  return params;
}
