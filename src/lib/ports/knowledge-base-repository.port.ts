import type { IndexingParams } from "@/types/api";

/**
 * Port: Knowledge base — Indexing and de-indexing.
 * Implementations may use API or mocks for tests.
 */
export interface KnowledgeBaseRepository {
  sync(
    connectionId: string,
    resourceIds: string[],
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }>;
  delete(knowledgeBaseId: string, resourcePath: string): Promise<void>;
}
