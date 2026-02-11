"use client";

import type { StatusFilter, TypeFilter } from "@/domain/types";
import type { SortOrder } from "@/utils/sort-files";
import { applyFilters } from "@/utils/filter-files";
import { sortFiles } from "@/utils/sort-files";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { SORT_ORDER_PARAM, STATUS_PARAM, TYPE_PARAM } from "./constants";
import type {
  FileFiltersActions,
  FileFiltersValues,
  UseFileFiltersParams,
  UseFileFiltersResult,
} from "./types";
import {
  buildUrlParams,
  parseSortOrder,
  parseStatus,
  parseType,
} from "./utils";

export function useFileFilters({
  rawItems,
  indexedIds,
}: UseFileFiltersParams): UseFileFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");

  const status = parseStatus(searchParams.get(STATUS_PARAM));
  const type = parseType(searchParams.get(TYPE_PARAM));
  const sortOrder = parseSortOrder(searchParams.get(SORT_ORDER_PARAM));

  const syncUrl = useCallback(
    (params: URLSearchParams) => {
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const updateStatus = useCallback(
    (newStatus: StatusFilter) => {
      startTransition(() => {
        syncUrl(buildUrlParams(searchParams, { status: newStatus }));
      });
    },
    [searchParams, syncUrl],
  );

  const updateType = useCallback(
    (newType: TypeFilter) => {
      startTransition(() => {
        syncUrl(buildUrlParams(searchParams, { type: newType }));
      });
    },
    [searchParams, syncUrl],
  );

  const toggleSort = useCallback(() => {
    const nextSortOrder: SortOrder = sortOrder === "asc" ? "desc" : "asc";
    startTransition(() => {
      syncUrl(buildUrlParams(searchParams, { sortOrder: nextSortOrder }));
    });
  }, [sortOrder, searchParams, syncUrl]);

  const clearFilters = useCallback(() => {
    startTransition(() => {
      setSearch("");
      const params = new URLSearchParams(searchParams.toString());
      params.delete(STATUS_PARAM);
      params.delete(TYPE_PARAM);
      syncUrl(params);
    });
  }, [searchParams, syncUrl]);

  const processedResources = useMemo(() => {
    const filtered = applyFilters(rawItems, {
      searchQuery: search,
      status,
      type,
      indexedIds,
    });
    return sortFiles(filtered, sortOrder);
  }, [rawItems, search, status, type, sortOrder, indexedIds]);

  const hasActiveFilters =
    status !== "all" || type !== "all" || search.trim() !== "";

  const filters: FileFiltersValues = useMemo(
    () => ({ search, status, type, sortOrder }),
    [search, status, type, sortOrder],
  );

  const actions: FileFiltersActions = useMemo(
    () => ({
      setSearch,
      updateStatus,
      updateType,
      toggleSort,
      clearFilters,
    }),
    [updateStatus, updateType, toggleSort, clearFilters],
  );

  return {
    processedResources,
    filters,
    actions,
    hasActiveFilters,
  };
}
