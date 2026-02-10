import type { ApiResource, FileNode } from "@/types";

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
 * Maps API resource (transport) to domain FileNode (UI model).
 * Used at Action level per DIP/domain vs transport separation.
 *
 * @param resource - Raw API resource from backend
 * @param parentId - Optional parent folder id (folder from which children were fetched)
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
