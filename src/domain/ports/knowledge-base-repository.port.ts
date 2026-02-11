import type { IndexingParams } from "@/infra/types/api-types";

/**
 * Port: Knowledge base — Indexing and de-indexing.
 * orgId is provided by the use case (from AuthRepository) — adapters do not depend on auth.
 * Implementations may use API or mocks for tests.
 */
export interface KnowledgeBaseRepository {
  sync(
    connectionId: string,
    resourceIds: string[],
    orgId: string,
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }>;
  delete(knowledgeBaseId: string, resourcePath: string): Promise<void>;
}
