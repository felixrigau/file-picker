import type { FileNode, StackAIResource } from "@/types";

/**
 * Extracts display name from inode path (last segment).
 * e.g. "folder/sub/file.pdf" → "file.pdf"
 */
function getDisplayName(resource: StackAIResource): string {
  const path = resource.inode_path.path;
  const lastSlash = path.lastIndexOf("/");
  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path || resource.resource_id;
}

/**
 * Maps Stack AI API resource (transport) to domain FileNode (UI model).
 * Used at Action level per DIP/domain vs transport separation.
 *
 * @param resource - Raw API resource from Stack AI
 * @param parentId - Optional parent folder id (folder from which children were fetched)
 */
export function mapStackAIResourceToFileNode(
  resource: StackAIResource,
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
  };
}
