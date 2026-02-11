import type { IndexingParams } from "@/infra/types/api-types";
import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";

/**
 * Test implementation — records calls, returns configurable knowledge_base_id.
 * Supports delayed resolution for optimistic UI tests (resolveSync/rejectSync).
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

  private pendingSync:
    | {
        resolve: (v: { knowledge_base_id: string }) => void;
        reject: (e: Error) => void;
      }
    | null = null;
  private pendingDeletes: Array<{
    resolve: () => void;
    reject: (e: Error) => void;
  }> = [];

  constructor(
    private readonly knowledgeBaseId = "test-knowledge-base-id",
    private syncMode: "immediate" | "pending" = "immediate",
    private deleteMode: "immediate" | "pending" = "immediate",
  ) {}

  /** Use pending sync: returns a promise that the test resolves via resolveSync/rejectSync. */
  static withPendingSync(
    knowledgeBaseId = "knowledge-base-1",
  ): KnowledgeBaseRepositoryTestImpl {
    return new KnowledgeBaseRepositoryTestImpl(knowledgeBaseId, "pending", "immediate");
  }

  /** Use pending delete: returns a promise that the test resolves via resolveDelete/rejectDelete. */
  static withPendingDelete(
    knowledgeBaseId = "knowledge-base-1",
  ): KnowledgeBaseRepositoryTestImpl {
    return new KnowledgeBaseRepositoryTestImpl(knowledgeBaseId, "immediate", "pending");
  }

  async sync(
    connectionId: string,
    resourceIds: string[],
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }> {
    this.syncCalls.push({ connectionId, resourceIds, indexingParams });
    if (this.syncMode === "pending") {
      return new Promise((resolve, reject) => {
        this.pendingSync = { resolve, reject };
      });
    }
    return { knowledge_base_id: this.knowledgeBaseId };
  }

  async delete(
    knowledgeBaseId: string,
    resourcePath: string,
  ): Promise<void> {
    this.deleteCalls.push({ knowledgeBaseId, resourcePath });
    if (this.deleteMode === "pending") {
      return new Promise((resolve, reject) => {
        this.pendingDeletes.push({ resolve, reject });
      });
    }
  }

  resolveSync(value: { knowledge_base_id: string }): void {
    this.pendingSync?.resolve(value);
    this.pendingSync = null;
  }

  rejectSync(error: Error): void {
    this.pendingSync?.reject(error);
    this.pendingSync = null;
  }

  resolveDelete(): void {
    this.pendingDeletes.shift()?.resolve();
  }

  rejectDelete(error: Error): void {
    this.pendingDeletes.shift()?.reject(error);
  }
}
