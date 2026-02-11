import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";

export async function deleteFromKnowledgeBaseUseCase(
  knowledgeBaseRepo: KnowledgeBaseRepository,
  knowledgeBaseId: string,
  resourcePath: string,
): Promise<void> {
  await knowledgeBaseRepo.delete(knowledgeBaseId, resourcePath);
}
