import type { KnowledgeBaseRepository } from "@/domain/ports/knowledge-base-repository.port";
import { describe, expect, it } from "vitest";
import { deleteFromKnowledgeBaseBatchUseCase } from "./delete-from-knowledge-base-batch.use-case";

describe("deleteFromKnowledgeBaseBatchUseCase", () => {
  it("returns successCount for all successful deletes", async () => {
    const kbRepo: KnowledgeBaseRepository = {
      sync: async () => ({ knowledge_base_id: "kb" }),
      delete: async () => {},
    };

    const result = await deleteFromKnowledgeBaseBatchUseCase(
      kbRepo,
      "kb-1",
      [
        { resourceId: "r1", resourcePath: "/p1" },
        { resourceId: "r2", resourcePath: "/p2" },
      ],
    );

    expect(result).toEqual({ successCount: 2, errorCount: 0 });
  });

  it("counts errors when some deletes fail", async () => {
    const kbRepo: KnowledgeBaseRepository = {
      sync: async () => ({ knowledge_base_id: "kb" }),
      delete: async (_kbId, resourcePath) => {
        if (resourcePath === "/fail") throw new Error("Delete failed");
      },
    };

    const result = await deleteFromKnowledgeBaseBatchUseCase(
      kbRepo,
      "kb-1",
      [
        { resourceId: "r1", resourcePath: "/ok" },
        { resourceId: "r2", resourcePath: "/fail" },
        { resourceId: "r3", resourcePath: "/ok2" },
      ],
    );

    expect(result).toEqual({ successCount: 2, errorCount: 1 });
  });
});
