import type { ApiResource, PaginatedApiResponse } from "@/types/api";
import type { FileResourceRepository } from "../../ports/file-resource-repository.port";

/**
 * Test implementation — returns configurable mock data. No external calls.
 */
export class FileResourceRepositoryTestImpl implements FileResourceRepository {
  constructor(
    private readonly data: ApiResource[] = [],
    private readonly nextCursor: string | null = null,
    private readonly currentCursor: string | null = null,
  ) {}

  async fetchContents(
    _folderId?: string,
  ): Promise<PaginatedApiResponse<ApiResource>> {
    return {
      data: this.data,
      next_cursor: this.nextCursor,
      current_cursor: this.currentCursor,
    };
  }

  async getDescendantIds(resourceId: string): Promise<string[]> {
    return [resourceId];
  }

  async getDescendantPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]> {
    return [{ resourceId, resourcePath: rootResourcePath }];
  }

  /** Fluently set mock data for fetchContents. */
  withData(data: ApiResource[]): FileResourceRepositoryTestImpl {
    return new FileResourceRepositoryTestImpl(
      data,
      this.nextCursor,
      this.currentCursor,
    );
  }
}
