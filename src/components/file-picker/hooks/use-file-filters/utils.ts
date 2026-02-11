import type { SortOrder } from "@/domain/types";
import type { StatusFilter, TypeFilter } from "@/domain/types";
import { SORT_ORDER_PARAM, STATUS_PARAM, TYPE_PARAM } from "./constants";

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
