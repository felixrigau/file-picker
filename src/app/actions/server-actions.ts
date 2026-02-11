"use server";

import {
  deleteFromKnowledgeBaseBatchUseCase,
  deleteFromKnowledgeBaseUseCase,
  getConnectionIdUseCase,
  getDescendantResourceIdsUseCase,
  getDescendantResourcesWithPathsUseCase,
  getFilesUseCase,
  syncToKnowledgeBaseUseCase,
} from "@/domain/use-cases";
import {
  getConnectionRepository,
  getFileResourceRepository,
  getKnowledgeBaseRepository,
} from "@/infra/modules/di-container";
import type { IndexingParams } from "@/infra/types/api-types";
import type { PaginatedFileNodes } from "@/domain/types";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedFileNodes> {
  return getFilesUseCase(getFileResourceRepository(), folderId);
}

export async function getConnectionIdAction(): Promise<{
  connectionId: string;
}> {
  return getConnectionIdUseCase(getConnectionRepository());
}

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>,
): Promise<{ knowledge_base_id: string }> {
  return syncToKnowledgeBaseUseCase(
    getKnowledgeBaseRepository(),
    connectionId,
    resourceIds,
    indexingParams,
  );
}

export async function getDescendantResourceIdsAction(
  resourceId: string,
): Promise<string[]> {
  return getDescendantResourceIdsUseCase(
    getFileResourceRepository(),
    resourceId,
  );
}

export async function getDescendantResourcesWithPathsAction(
  resourceId: string,
  rootResourcePath: string,
): Promise<{ resourceId: string; resourcePath: string }[]> {
  return getDescendantResourcesWithPathsUseCase(
    getFileResourceRepository(),
    resourceId,
    rootResourcePath,
  );
}

export async function deleteFromKnowledgeBaseAction(
  knowledgeBaseId: string,
  resourcePath: string,
): Promise<void> {
  return deleteFromKnowledgeBaseUseCase(
    getKnowledgeBaseRepository(),
    knowledgeBaseId,
    resourcePath,
  );
}

export async function deleteFromKnowledgeBaseBatchAction(
  knowledgeBaseId: string,
  items: { resourceId: string; resourcePath: string }[],
): Promise<{ successCount: number; errorCount: number }> {
  return deleteFromKnowledgeBaseBatchUseCase(
    getKnowledgeBaseRepository(),
    knowledgeBaseId,
    items,
  );
}
