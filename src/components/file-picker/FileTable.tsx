"use client";

import type { FileNode } from "@/types";

interface FileTableProps {
  /** Domain file nodes to display (data from useGDriveFiles) */
  resources: FileNode[];
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
        {resources.map((node) => {
          const isFolder = node.type === "folder";

          return (
            <tr
              key={node.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => isFolder && onFolderOpen(node.id, node.name)}
                  disabled={!isFolder}
                  className={`text-left w-full ${isFolder ? "cursor-pointer font-medium" : "cursor-default"}`}
                >
                  {node.name}
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
