import type { IndexingParams } from "@/types/api";
import type { KnowledgeBaseRepository } from "../../ports/knowledge-base-repository.port";

/**
 * Test implementation — records calls, returns fixed knowledge_base_id.
 * No external calls.
 */
export class KnowledgeBaseRepositoryTestImpl implements KnowledgeBaseRepository {
  readonly syncCalls: Array<{
    connectionId: string;
    resourceIds: string[];
    indexingParams?: Partial<IndexingParams>;
  }> = [];
  readonly deleteCalls: Array<{
    knowledgeBaseId: string;
    resourcePath: string;
  }> = [];

  constructor(private readonly knowledgeBaseId = "test-kb-id") {}

  async sync(
    connectionId: string,
    resourceIds: string[],
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }> {
    this.syncCalls.push({ connectionId, resourceIds, indexingParams });
    return { knowledge_base_id: this.knowledgeBaseId };
  }

  async delete(
    knowledgeBaseId: string,
    resourcePath: string,
  ): Promise<void> {
    this.deleteCalls.push({ knowledgeBaseId, resourcePath });
  }
}
