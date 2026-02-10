"use client";

import { getFilesAction } from "@/app/actions/server-actions";
import { useQuery } from "@tanstack/react-query";
import { stackAIQueryKeys } from "./query-keys";

/**
 * Fetches GDrive file/folder list for the given folder (root when folderId is omitted).
 * Uses Server Action that calls getStackAIService().fetchGDriveContents().
 *
 * @param folderId - Optional resource_id to list children of; omit for root
 * @returns TanStack Query result with PaginatedResponse<StackAIResource>
 */
export function useGDriveFiles(folderId?: string) {
  return useQuery({
    queryKey: stackAIQueryKeys.gdrive(folderId),
    queryFn: () => getFilesAction(folderId),
  });
}
