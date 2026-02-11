import type { AuthRepository } from "@/domain/ports/auth-repository.port";
import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";

export async function syncToKnowledgeBaseUseCase(
  authRepository: AuthRepository,
  knowledgeBaseRepo: KnowledgeBaseRepository,
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Parameters<KnowledgeBaseRepository["sync"]>[3],
): Promise<{ knowledge_base_id: string }> {
  const orgId = await authRepository.getOrganizationId();
  return knowledgeBaseRepo.sync(
    connectionId,
    resourceIds,
    orgId,
    indexingParams,
  );
}
