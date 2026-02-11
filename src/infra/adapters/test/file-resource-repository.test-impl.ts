import type { ApiResource } from "@/infra/types/api-types";
import type { FileNode, PaginatedFileNodes } from "@/domain/types";
import type { FileResourceRepository } from "@/domain/ports/file-resource-repository.port";

/**
 * Converts a FileNode (domain) to ApiResource (API) for test data.
 * Used when tests need to simulate raw API responses.
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

/** Queue entry: domain response or { __throw: Error } to simulate failures. */
type FetchResponseOrError = PaginatedFileNodes | { __throw: Error };

/**
 * Test implementation — returns configurable mock data. No external calls.
 * Use withQueue() for multiple fetchContents calls (e.g. root then folder).
 */
export class FileResourceRepositoryTestImpl implements FileResourceRepository {
  private responsesQueue: FetchResponseOrError[] = [];

  private getDescendantIdsImpl?: (resourceId: string) => string[];
  private getDescendantPathsImpl?: (
    resourceId: string,
    rootResourcePath: string,
  ) => { resourceId: string; resourcePath: string }[];

  constructor(responsesOrData: PaginatedFileNodes[] | FileNode[][] = []) {
    if (responsesOrData.length > 0) {
      const first = responsesOrData[0];
      if (Array.isArray(first)) {
        this.responsesQueue = (responsesOrData as FileNode[][]).map(
          (nodes) =>
            ({
              items: nodes,
              nextCursor: null,
              currentCursor: null,
            }) satisfies PaginatedFileNodes,
        );
      } else {
        this.responsesQueue = responsesOrData as PaginatedFileNodes[];
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

  /** Create impl that returns domain data. Accepts FileNode[] for convenience. */
  static fromFileNodes(
    ...batches: FileNode[][]
  ): FileResourceRepositoryTestImpl {
    const queue = batches.map(
      (nodes) =>
        ({
          items: nodes,
          nextCursor: null,
          currentCursor: null,
        }) satisfies PaginatedFileNodes,
    );
    return FileResourceRepositoryTestImpl.withQueue(queue);
  }

  async fetchContents(_folderId?: string): Promise<PaginatedFileNodes> {
    const next = this.responsesQueue.shift();
    if (next) {
      if ("__throw" in next && next.__throw instanceof Error) {
        throw next.__throw;
      }
      return next as PaginatedFileNodes;
    }
    return {
      items: [],
      nextCursor: null,
      currentCursor: null,
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
