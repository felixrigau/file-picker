"use server";

import {
  deleteFromKnowledgeBaseBatchUseCase,
  deleteFromKnowledgeBaseUseCase,
  syncToKnowledgeBaseUseCase,
} from "@/domain/use-cases";
import {
  getAuthRepository,
  getKnowledgeBaseRepository,
} from "@/infra/modules/di-container";
import type { IndexingParams } from "@/infra/types/api-types";

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>,
): Promise<{ knowledge_base_id: string }> {
  return syncToKnowledgeBaseUseCase(
    getAuthRepository(),
    getKnowledgeBaseRepository(),
    connectionId,
    resourceIds,
    indexingParams,
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
