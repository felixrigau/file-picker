import { KnowledgeBaseRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";
import { syncToKnowledgeBaseUseCase } from "./sync-to-knowledge-base.use-case";

describe("syncToKnowledgeBaseUseCase", () => {
  it("delegates to repo and returns knowledge_base_id", async () => {
    const kbRepo = new KnowledgeBaseRepositoryTestImpl("kb-xyz");

    const result = await syncToKnowledgeBaseUseCase(
      kbRepo,
      "conn-1",
      ["id1", "id2"],
    );

    expect(result.knowledge_base_id).toBe("kb-xyz");
    expect(kbRepo.syncCalls).toHaveLength(1);
    expect(kbRepo.syncCalls[0]).toEqual({
      connectionId: "conn-1",
      resourceIds: ["id1", "id2"],
      indexingParams: undefined,
    });
  });

  it("passes indexingParams when provided", async () => {
    const kbRepo = new KnowledgeBaseRepositoryTestImpl("kb-1");
    const indexingParams = {
      ocr: true,
      embedding_params: { embedding_model: "test", api_key: null },
      chunker_params: {
        chunk_size: 512,
        chunk_overlap: 64,
        chunker: "recursive",
      },
    };

    await syncToKnowledgeBaseUseCase(kbRepo, "conn-1", ["r1"], indexingParams);

    expect(kbRepo.syncCalls[0].indexingParams).toEqual(indexingParams);
  });
});
