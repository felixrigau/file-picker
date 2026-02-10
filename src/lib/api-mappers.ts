import type { PaginatedApiResponse } from "@/types/api";
import type { ApiResource } from "@/types/api";
import type { FileNode, PaginatedResult } from "@/types/domain";

/**
 * Extracts display name from inode path (last segment).
 * e.g. "folder/sub/file.pdf" → "file.pdf"
 */
function getDisplayName(resource: ApiResource): string {
  const path = resource.inode_path.path;
  const lastSlash = path.lastIndexOf("/");
  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path || resource.resource_id;
}

/**
 * Maps infrastructure (API) resource to domain FileNode.
 * Used at Action level per DIP — keeps transport types out of domain.
 *
 * @param resource - API resource (infra/transport layer)
 * @param parentId - Optional parent folder id (folder from which children were fetched)
 * @returns Domain FileNode for UI consumption
 */
export function mapResourceToFileNode(
  resource: ApiResource,
  parentId?: string,
): FileNode {
  const isFolder = resource.inode_type === "directory";
  return {
    id: resource.resource_id,
    name: getDisplayName(resource),
    type: isFolder ? "folder" : "file",
    updatedAt: resource.updated_at ?? resource.created_at ?? "",
    isIndexed: resource.status === "indexed",
    parentId,
    resourcePath: resource.inode_path?.path ?? undefined,
  };
}

/**
 * Maps paginated API response to domain PaginatedResult.
 * API → Domain boundary for list responses.
 *
 * @param apiResponse - Raw paginated response from API
 * @param parentId - Optional parent folder id for child nodes
 * @returns Domain PaginatedResult for View consumption
 */
export function mapPaginatedApiResponseToResult(
  apiResponse: PaginatedApiResponse<ApiResource>,
  parentId?: string,
): PaginatedResult<FileNode> {
  return {
    items: apiResponse.data.map((r) => mapResourceToFileNode(r, parentId)),
    nextCursor: apiResponse.next_cursor,
    currentCursor: apiResponse.current_cursor,
  };
}
