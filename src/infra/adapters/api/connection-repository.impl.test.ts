import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectionRepositoryImpl } from "./connection-repository.impl";

vi.mock("@/infra/utils/get-env", () => ({
  getEnv: vi.fn((key: string) => {
    if (key === "STACK_AI_BACKEND_URL") return "https://api.test";
    throw new Error(`Unknown env: ${key}`);
  }),
}));

describe("ConnectionRepositoryImpl", () => {
  const mockRequest = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns first connection_id when response is array", async () => {
    mockRequest.mockResolvedValue([{ connection_id: "conn-123" }]);

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    const result = await repo.getConnectionId();
    expect(result).toBe("conn-123");
    expect(mockRequest).toHaveBeenCalledWith(
      "GET",
      "https://api.test/v1/connections?limit=10",
    );
  });

  it("returns first connection_id when response has data", async () => {
    mockRequest.mockResolvedValue({
      data: [{ connection_id: "conn-data" }],
    });

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    const result = await repo.getConnectionId();
    expect(result).toBe("conn-data");
  });

  it("returns first connection_id when response has results", async () => {
    mockRequest.mockResolvedValue({
      results: [{ connection_id: "conn-results" }],
    });

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    const result = await repo.getConnectionId();
    expect(result).toBe("conn-results");
  });

  it("returns first connection_id when response has items", async () => {
    mockRequest.mockResolvedValue({
      items: [{ connection_id: "conn-items" }],
    });

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    const result = await repo.getConnectionId();
    expect(result).toBe("conn-items");
  });

  it("throws when no connections found", async () => {
    mockRequest.mockResolvedValue([]);

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    await expect(repo.getConnectionId()).rejects.toThrow(
      "No Google Drive connection found",
    );
  });

  it("throws when response object has empty data", async () => {
    mockRequest.mockResolvedValue({ data: [] });

    const repo = new ConnectionRepositoryImpl({
      request: mockRequest,
    } as never);

    await expect(repo.getConnectionId()).rejects.toThrow(
      "No Google Drive connection found",
    );
  });
});
