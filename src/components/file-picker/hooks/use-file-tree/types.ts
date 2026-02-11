import type { BreadcrumbSegment } from "@/domain/types";

export type { BreadcrumbSegment };

import type { FileNode, SortOrder } from "@/domain/types";
import type { DisplayRow } from "@/components/file-table";

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
