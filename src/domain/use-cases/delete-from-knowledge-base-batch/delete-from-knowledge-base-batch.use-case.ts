import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";

export async function deleteFromKnowledgeBaseBatchUseCase(
  knowledgeBaseRepo: KnowledgeBaseRepository,
  knowledgeBaseId: string,
  items: { resourceId: string; resourcePath: string }[],
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;
  for (const { resourcePath: path } of items) {
    try {
      await knowledgeBaseRepo.delete(knowledgeBaseId, path);
      successCount++;
    } catch {
      errorCount++;
    }
  }
  return { successCount, errorCount };
}
