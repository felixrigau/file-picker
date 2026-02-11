import type { ApiResource, PaginatedApiResponse } from "@/types/api";
import type { FileNode } from "@/types/domain";
import type { FileResourceRepository } from "../../ports/file-resource-repository.port";

/**
 * Converts a FileNode (domain) to ApiResource (API) for test data.
 */
export function fileNodeToApiResource(node: FileNode): ApiResource {
  return {
    resource_id: node.id,
    inode_type: node.type === "folder" ? "directory" : "file",
    inode_path: { path: node.resourcePath ?? node.name },
    status: node.isIndexed ? "indexed" : undefined,
    updated_at: node.updatedAt,
    created_at: node.updatedAt,
  };
}

/**
 * Test implementation — returns configurable mock data. No external calls.
 * Use withQueue() for multiple fetchContents calls (e.g. root then folder).
 */
/** Queue entry: normal response or { __throw: Error } to simulate failures. */
type FetchResponseOrError =
  | PaginatedApiResponse<ApiResource>
  | { __throw: Error };

export class FileResourceRepositoryTestImpl implements FileResourceRepository {
  private responsesQueue: FetchResponseOrError[] = [];

  private getDescendantIdsImpl?: (resourceId: string) => string[];
  private getDescendantPathsImpl?: (
    resourceId: string,
    rootResourcePath: string,
  ) => { resourceId: string; resourcePath: string }[];

  constructor(
    responsesOrData:
      | PaginatedApiResponse<ApiResource>[]
      | ApiResource[] = [],
  ) {
    if (responsesOrData.length > 0) {
      const first = responsesOrData[0];
      if ("data" in first && Array.isArray(first.data)) {
        this.responsesQueue = responsesOrData as PaginatedApiResponse<ApiResource>[];
      } else {
        this.responsesQueue = [
          {
            data: responsesOrData as ApiResource[],
            next_cursor: null,
            current_cursor: null,
          },
        ];
      }
    }
  }

  /** Create impl with a queue. Each fetchContents() returns the next. Use { __throw: new Error("...") } for failures. */
  static withQueue(
    responses: FetchResponseOrError[],
  ): FileResourceRepositoryTestImpl {
    const impl = new FileResourceRepositoryTestImpl();
    impl.responsesQueue = [...responses];
    return impl;
  }

  /** Create impl that returns domain-like data. Accepts FileNode[] for convenience. */
  static fromFileNodes(
    ...batches: FileNode[][]
  ): FileResourceRepositoryTestImpl {
    const queue = batches.map((nodes) => ({
      data: nodes.map(fileNodeToApiResource),
      next_cursor: null as string | null,
      current_cursor: null as string | null,
    }));
    return FileResourceRepositoryTestImpl.withQueue(queue);
  }

  async fetchContents(
    _folderId?: string,
  ): Promise<PaginatedApiResponse<ApiResource>> {
    const next = this.responsesQueue.shift();
    if (next) {
      if ("__throw" in next && next.__throw instanceof Error) {
        throw next.__throw;
      }
      return next as PaginatedApiResponse<ApiResource>;
    }
    return {
      data: [],
      next_cursor: null,
      current_cursor: null,
    };
  }

  withDescendantIds(fn: (resourceId: string) => string[]): this {
    this.getDescendantIdsImpl = fn;
    return this;
  }

  withDescendantPaths(
    fn: (
      resourceId: string,
      rootResourcePath: string,
    ) => { resourceId: string; resourcePath: string }[],
  ): this {
    this.getDescendantPathsImpl = fn;
    return this;
  }

  async getDescendantIds(resourceId: string): Promise<string[]> {
    if (this.getDescendantIdsImpl) {
      return this.getDescendantIdsImpl(resourceId);
    }
    return [resourceId];
  }

  async getDescendantPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]> {
    if (this.getDescendantPathsImpl) {
      return this.getDescendantPathsImpl(resourceId, rootResourcePath);
    }
    return [{ resourceId, resourcePath: rootResourcePath }];
  }
}
