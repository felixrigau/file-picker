"use client";

import { getFilesAction } from "@/actions/files.actions";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

/** 1 min — data considered fresh; no refetch when re-mounting */
const STALE_TIME_MS = 60 * 1000;
/** 5 min — keep visited folders in cache for instant back navigation */
const GC_TIME_MS = 5 * 60 * 1000;

/**
 * Shared options for Google Drive folder queries. Use for prefetch, fetchQuery, and useQuery
 * to ensure cache consistency (same staleTime, gcTime, queryFn).
 */
export function getGoogleDriveQueryOptions(folderId: string | undefined) {
  return {
    queryKey: queryKeys.googleDrive(folderId),
    queryFn: () => getFilesAction(folderId),
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  } as const;
}

/**
 * Fetches Google Drive file/folder list for the given folder (root when folderId is omitted).
 * Uses Server Action that maps ApiResource → FileNode at the Action level.
 * Stale-while-revalidate: cached data shown instantly when re-navigating.
 *
 * @param folderId - Optional resource_id to list children of; omit for root
 * @returns TanStack Query result with PaginatedFileNodes
 */
export function useGoogleDriveFiles(folderId?: string) {
  return useQuery(getGoogleDriveQueryOptions(folderId));
}
