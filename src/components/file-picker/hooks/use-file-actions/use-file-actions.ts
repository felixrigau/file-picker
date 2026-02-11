"use client";

import type { FileNode } from "@/domain/types";
import {
  isMissingEnvErrorUseCase,
  validateDeIndexResourceUseCase,
  validateIndexResourceUseCase,
} from "@/domain/use-cases";
import { useActiveKnowledgeBaseId, useKnowledgeBaseActions } from "@/hooks";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { UseFileActionsParams, UseFileActionsResult } from ".";

export function useFileActions({
  isError,
  error,
  onRefetch,
  onIndexError,
  onDeIndexError,
}: UseFileActionsParams): UseFileActionsResult {
  const activeKnowledgeBaseId = useActiveKnowledgeBaseId();
  const {
    indexNode,
    indexResource,
    deIndexResource,
    deIndexFolder,
    deIndexNode,
  } = useKnowledgeBaseActions();

  const isMissingEnv = isError && isMissingEnvErrorUseCase(error);

  const hasGenericError = isError && !isMissingEnv;

  const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

  useEffect(() => {
    if (indexResource.isError && indexResource.variables && onIndexError) {
      const ids =
        indexResource.variables.expandedIds ?? [indexResource.variables.node.id];
      onIndexError(ids);
    }
  }, [indexResource.isError, indexResource.variables, onIndexError]);

  useEffect(() => {
    if (deIndexResource.isError && deIndexResource.variables?.resourceId && onDeIndexError) {
      onDeIndexError([deIndexResource.variables.resourceId]);
    }
  }, [deIndexResource.isError, deIndexResource.variables, onDeIndexError]);

  useEffect(() => {
    if (
      deIndexFolder.isError &&
      deIndexFolder.variables?.items &&
      onDeIndexError
    ) {
      const ids = deIndexFolder.variables.items.map((i) => i.resourceId);
      onDeIndexError(ids);
    }
  }, [deIndexFolder.isError, deIndexFolder.variables, onDeIndexError]);

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
