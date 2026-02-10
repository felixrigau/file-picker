"use client";

import type { StackAIResource } from "@/types";

/**
 * Extracts the display name from a resource's inode path.
 * Uses the last segment of the path (e.g. "folder/file.pdf" → "file.pdf").
 */
function getResourceDisplayName(resource: StackAIResource): string {
  const path = resource.inode_path.path;
  const lastSlash = path.lastIndexOf("/");
  return lastSlash >= 0 ? path.slice(lastSlash + 1) : path || resource.resource_id;
}

interface FileTableProps {
  /** Paginated resources to display (data from useGDriveFiles) */
  resources: StackAIResource[];
  /** Whether the data is currently loading */
  isLoading: boolean;
  /** Called when user opens a folder (navigate into it) */
  onFolderOpen: (id: string, name: string) => void;
}

/**
 * Table component that renders GDrive files/folders.
 * Handles only presentation and folder navigation; state lives in parent.
 */
export function FileTable({
  resources,
  isLoading,
  onFolderOpen,
}: FileTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No files or folders
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          <th className="px-4 py-2 text-left font-medium">Name</th>
          <th className="px-4 py-2 text-left font-medium">Type</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => {
          const name = getResourceDisplayName(resource);
          const isFolder = resource.inode_type === "directory";

          return (
            <tr
              key={resource.resource_id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => isFolder && onFolderOpen(resource.resource_id, name)}
                  disabled={!isFolder}
                  className={`text-left w-full ${isFolder ? "cursor-pointer font-medium" : "cursor-default"}`}
                >
                  {name}
                </button>
              </td>
              <td className="px-4 py-2 text-muted-foreground">
                {isFolder ? "Folder" : "File"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
