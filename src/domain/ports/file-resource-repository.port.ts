import type { PaginatedFileNodes } from "@/domain/types";

/**
 * Port: File resource — Google Drive files/folders listing and traversal.
 * Implementations return domain types; mapping happens inside the repository.
 */
export interface FileResourceRepository {
  fetchContents(folderId?: string): Promise<PaginatedFileNodes>;
  getDescendantIds(resourceId: string): Promise<string[]>;
  getDescendantPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]>;
}
