import type { ApiResource, PaginatedApiResponse } from "@/infra/types/api-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileResourceRepositoryImpl } from "./file-resource-repository.impl";

vi.mock("@/infra/utils/get-env", () => ({
  getEnv: vi.fn((key: string) => {
    if (key === "STACK_AI_BACKEND_URL") return "https://api.test";
    throw new Error(`Unknown env: ${key}`);
  }),
}));

function apiResource(overrides: Partial<ApiResource> = {}): ApiResource {
  return {
    resource_id: "res-1",
    inode_type: "file",
    inode_path: { path: "folder/file.pdf" },
    ...overrides,
  };
}

describe("FileResourceRepositoryImpl", () => {
  const mockRequest = vi.fn();
  const mockGetConnectionId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConnectionId.mockResolvedValue("conn-123");
  });

  it("fetchContents calls API with connectionId and optional folderId", async () => {
    const apiResponse: PaginatedApiResponse<ApiResource> = {
      data: [apiResource()],
      next_cursor: null,
      current_cursor: null,
    };
    mockRequest.mockResolvedValue(apiResponse);

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    const result = await repo.fetchContents("folder-id");

    expect(mockGetConnectionId).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalledWith(
      "GET",
      "https://api.test/v1/connections/conn-123/resources/children?resource_id=folder-id",
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("res-1");
    expect(result.items[0].name).toBe("file.pdf");
  });

  it("fetchContents calls API without folderId for root", async () => {
    const apiResponse: PaginatedApiResponse<ApiResource> = {
      data: [],
      next_cursor: null,
      current_cursor: null,
    };
    mockRequest.mockResolvedValue(apiResponse);

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    await repo.fetchContents();

    expect(mockRequest).toHaveBeenCalledWith(
      "GET",
      "https://api.test/v1/connections/conn-123/resources/children",
    );
  });

  it("getDescendantIds returns resource and children ids recursively", async () => {
    const folderResource = apiResource({
      resource_id: "folder-1",
      inode_type: "directory",
      inode_path: { path: "folder" },
    });
    const fileResource = apiResource({
      resource_id: "file-1",
      inode_path: { path: "folder/file.pdf" },
    });

    mockRequest
      .mockResolvedValueOnce({
        data: [folderResource, fileResource],
        next_cursor: null,
        current_cursor: null,
      })
      .mockResolvedValueOnce({
        data: [],
        next_cursor: null,
        current_cursor: null,
      });

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    const ids = await repo.getDescendantIds("root-id");

    expect(ids).toContain("root-id");
    expect(ids).toContain("folder-1");
    expect(ids).toContain("file-1");
  });

  it("getDescendantIds returns only resource when fetch fails", async () => {
    mockRequest.mockRejectedValue(new Error("Network error"));

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    const ids = await repo.getDescendantIds("single-id");

    expect(ids).toEqual(["single-id"]);
  });

  it("getDescendantPaths returns root and descendant paths", async () => {
    const childResource = apiResource({
      resource_id: "child-1",
      inode_path: { path: "root/child.pdf" },
    });

    mockRequest.mockResolvedValueOnce({
      data: [childResource],
      next_cursor: null,
      current_cursor: null,
    });

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    const paths = await repo.getDescendantPaths("root-id", "/My Drive");

    expect(paths).toContainEqual({
      resourceId: "root-id",
      resourcePath: "/My Drive",
    });
    expect(paths).toContainEqual({
      resourceId: "child-1",
      resourcePath: "root/child.pdf",
    });
  });

  it("getDescendantPaths returns only root when fetch fails", async () => {
    mockRequest.mockRejectedValue(new Error("Network error"));

    const repo = new FileResourceRepositoryImpl(
      { request: mockRequest } as never,
      { getConnectionId: mockGetConnectionId } as never,
    );

    const paths = await repo.getDescendantPaths("root-id", "/root");

    expect(paths).toEqual([{ resourceId: "root-id", resourcePath: "/root" }]);
  });
});
