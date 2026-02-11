import type { FileNode } from "@/domain/types";

/** Props for FilePicker — data + actions from container. UI hooks (filters, tree) are internal. */
export interface FilePickerProps {
  /** Raw items from current folder (before filtering) */
  rawItems: FileNode[];
  /** Indexed resource IDs for status display */
  indexedIds: string[];
  /** Loading state */
  isLoading: boolean;
  /** Whether there is a generic error */
  hasError: boolean;
  /** Error message when hasError */
  errorMessage: string;
  /** Index / de-index handlers */
  onIndexRequest: (node: FileNode) => void;
  onDeIndexRequest: (node: FileNode) => void;
  /** Pending state checkers */
  isIndexPending: (resourceId: string) => boolean;
  isDeIndexPending: (resourceId: string) => boolean;
  /** Refetch on error */
  onRefetch: () => void;
  /** Called when current folder changes (for container to refetch) */
  onCurrentFolderChange: (folderId: string | undefined) => void;
}
