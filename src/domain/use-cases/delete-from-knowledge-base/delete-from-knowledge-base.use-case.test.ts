import { KnowledgeBaseRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";
import { deleteFromKnowledgeBaseUseCase } from "./delete-from-knowledge-base.use-case";

describe("deleteFromKnowledgeBaseUseCase", () => {
  it("delegates to repo delete", async () => {
    const kbRepo = new KnowledgeBaseRepositoryTestImpl("kb-1");

    await deleteFromKnowledgeBaseUseCase(
      kbRepo,
      "kb-1",
      "/some/resource/path",
    );

    expect(kbRepo.deleteCalls).toHaveLength(1);
    expect(kbRepo.deleteCalls[0]).toEqual({
      knowledgeBaseId: "kb-1",
      resourcePath: "/some/resource/path",
    });
  });
});
