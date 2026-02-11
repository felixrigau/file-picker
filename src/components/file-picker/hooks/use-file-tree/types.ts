import type { FileNode } from "@/domain/types";
import type { DisplayRow } from "@/components/file-table";
import type { SortOrder } from "@/domain/types";

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

export interface UseFileTreeParams {
  sortedResources: FileNode[];
  sortOrder: SortOrder;
  onCurrentFolderChange: (folderId: string | undefined) => void;
  onNavigateStart?: () => void;
}

export interface UseFileTreeResult {
  data: {
    displayedResources: DisplayRow[];
    expandedIds: Set<string>;
    breadcrumbPath: BreadcrumbSegment[];
  };
  action: {
    mapsTo: (id: string | undefined, displayName?: string) => void;
    onFolderToggle: (folderId: string) => void;
    onFolderHover: (folderId: string) => void;
    onFolderHoverCancel: (folderId: string) => void;
  };
}
