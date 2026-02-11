import type { ApiResource, PaginatedApiResponse } from "@/infra/types/api-types";

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
