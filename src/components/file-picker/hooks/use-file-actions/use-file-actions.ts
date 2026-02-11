"use client";

import type { FileNode } from "@/domain/types";
import {
  isMissingEnvErrorUseCase,
  validateDeIndexResourceUseCase,
  validateIndexResourceUseCase,
} from "@/domain/use-cases";
import { useActiveKnowledgeBaseId, useKBActions } from "@/hooks";
import { useCallback } from "react";
import { toast } from "sonner";

export interface UseFileActionsParams {
  isError: boolean;
  error: Error | null;
  onRefetch?: () => void;
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

export function useFileActions({
  isError,
  error,
  onRefetch,
}: UseFileActionsParams): UseFileActionsResult {
  const activeKnowledgeBaseId = useActiveKnowledgeBaseId();
  const {
    indexNode,
    indexResource,
    deIndexResource,
    deIndexFolder,
    deIndexNode,
  } = useKBActions();

  const isMissingEnv = isError && isMissingEnvErrorUseCase(error);

  const hasGenericError = isError && !isMissingEnv;

  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";

  const refetch = useCallback(() => {
    onRefetch?.();
  }, [onRefetch]);

  const handleIndex = useCallback(
    (node: FileNode) => {
      const validation = validateIndexResourceUseCase(node);
      if (!validation.success) {
        toast.error(validation.error);
        return;
      }
      indexNode(node);
    },
    [indexNode],
  );

  const handleDeIndex = useCallback(
    (node: FileNode) => {
      const validation = validateDeIndexResourceUseCase(
        node,
        activeKnowledgeBaseId,
      );
      if (!validation.success) {
        toast.error(validation.error);
        return;
      }
      deIndexNode(node, activeKnowledgeBaseId!);
    },
    [activeKnowledgeBaseId, deIndexNode],
  );

  const isIndexPending = useCallback(
    (resourceId: string) =>
      indexResource.isPending &&
      (indexResource.variables?.expandedIds?.includes(resourceId) ?? false),
    [indexResource.isPending, indexResource.variables],
  );

  const isDeIndexPending = useCallback(
    (resourceId: string) => {
      if (deIndexResource.isPending) {
        return deIndexResource.variables?.resourceId === resourceId;
      }
      if (deIndexFolder.isPending) {
        const ids =
          deIndexFolder.variables?.items?.map((i) => i.resourceId) ?? [];
        return ids.includes(resourceId);
      }
      return false;
    },
    [
      deIndexResource.isPending,
      deIndexResource.variables,
      deIndexFolder.isPending,
      deIndexFolder.variables,
    ],
  );

  return {
    data: {
      isIndexPending,
      isDeIndexPending,
      isMissingEnv,
      hasGenericError,
      errorMessage,
    },
    action: {
      handleIndex,
      handleDeIndex,
      refetch,
    },
  };
}
