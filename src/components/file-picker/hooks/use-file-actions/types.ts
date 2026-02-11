import { FileNode } from "@/domain/types";

export interface UseFileActionsParams {
  isError: boolean;
  error: Error | null;
  onRefetch?: () => void;
  onIndexError?: (resourceIds: string[]) => void;
  onDeIndexError?: (resourceIds: string[]) => void;
}

export interface UseFileActionsResult {
  data: {
    isIndexPending: (resourceId: string) => boolean;
    isDeIndexPending: (resourceId: string) => boolean;
    isMissingEnv: boolean;
    hasGenericError: boolean;
    errorMessage: string;
  };
  action: {
    handleIndex: (node: FileNode) => void;
    handleDeIndex: (node: FileNode) => void;
    refetch: () => void;
  };
}
