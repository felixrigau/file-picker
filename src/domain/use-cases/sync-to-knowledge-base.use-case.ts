import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";

export async function syncToKnowledgeBaseUseCase(
  knowledgeBaseRepo: KnowledgeBaseRepository,
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Parameters<KnowledgeBaseRepository["sync"]>[2],
): Promise<{ knowledge_base_id: string }> {
  return knowledgeBaseRepo.sync(connectionId, resourceIds, indexingParams);
}
