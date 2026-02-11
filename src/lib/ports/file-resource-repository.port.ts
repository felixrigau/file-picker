import type { ApiResource, PaginatedApiResponse } from "@/types/api";

/**
 * Port: File resource — GDrive files/folders listing and traversal.
 * Implementations may use API, local cache, or mocks for tests.
 */
export interface FileResourceRepository {
  fetchContents(folderId?: string): Promise<PaginatedApiResponse<ApiResource>>;
  getDescendantIds(resourceId: string): Promise<string[]>;
  getDescendantPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]>;
}
