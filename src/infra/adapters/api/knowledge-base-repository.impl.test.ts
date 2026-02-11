import { beforeEach, describe, expect, it, vi } from "vitest";
import { KnowledgeBaseRepositoryImpl } from "./knowledge-base-repository.impl";

vi.mock("@/infra/utils/get-env", () => ({
  getEnv: vi.fn((key: string) => {
    if (key === "STACK_AI_BACKEND_URL") return "https://api.test";
    throw new Error(`Unknown env: ${key}`);
  }),
}));

describe("KnowledgeBaseRepositoryImpl", () => {
  const mockRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sync creates knowledge base and triggers sync with orgId", async () => {
    mockRequest
      .mockResolvedValueOnce({ knowledge_base_id: "kb-789" })
      .mockResolvedValueOnce(undefined);

    const repo = new KnowledgeBaseRepositoryImpl({ request: mockRequest } as never);

    const result = await repo.sync("conn-123", ["res-1", "res-2"], "org-456");

    expect(result.knowledge_base_id).toBe("kb-789");

    expect(mockRequest).toHaveBeenNthCalledWith(
      1,
      "POST",
      "https://api.test/knowledge_bases",
      expect.objectContaining({
        body: expect.stringContaining("conn-123"),
      }),
    );
    const body = JSON.parse(mockRequest.mock.calls[0][2].body);
    expect(body.connection_id).toBe("conn-123");
    expect(body.connection_source_ids).toEqual(["res-1", "res-2"]);
    expect(body.indexing_params).toBeDefined();

    expect(mockRequest).toHaveBeenNthCalledWith(
      2,
      "GET",
      "https://api.test/knowledge_bases/sync/trigger/kb-789/org-456",
    );
  });

  it("sync merges custom indexing params", async () => {
    mockRequest
      .mockResolvedValueOnce({ knowledge_base_id: "kb-1" })
      .mockResolvedValueOnce(undefined);

    const repo = new KnowledgeBaseRepositoryImpl({ request: mockRequest } as never);

    await repo.sync("conn-1", ["res-1"], "org-1", {
      ocr: true,
      unstructured: false,
    });

    const body = JSON.parse(mockRequest.mock.calls[0][2].body);
    expect(body.indexing_params.ocr).toBe(true);
    expect(body.indexing_params.unstructured).toBe(false);
  });

  it("delete calls DELETE with resource_path query", async () => {
    mockRequest.mockResolvedValue(undefined);

    const repo = new KnowledgeBaseRepositoryImpl({ request: mockRequest } as never);

    await repo.delete("kb-1", "/My Drive/folder/file.pdf");

    expect(mockRequest).toHaveBeenCalledWith(
      "DELETE",
      "https://api.test/knowledge_bases/kb-1/resources?resource_path=%2FMy+Drive%2Ffolder%2Ffile.pdf",
    );
  });
});
