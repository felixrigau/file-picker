import { describe, expect, it } from "vitest";
import {
  mapPaginatedApiResponseToResult,
  mapResourceToFileNode,
} from "./api-mappers";
import type { ApiResource } from "@/infra/types/api-types";

function apiResource(overrides: Partial<ApiResource> = {}): ApiResource {
  return {
    resource_id: "res-1",
    inode_type: "file",
    inode_path: { path: "folder/sub/file.pdf" },
    status: "indexed",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("mapResourceToFileNode", () => {
  it("maps API resource to FileNode with display name from path", () => {
    const resource = apiResource();
    const result = mapResourceToFileNode(resource);
    expect(result.id).toBe("res-1");
    expect(result.name).toBe("file.pdf");
    expect(result.type).toBe("file");
    expect(result.updatedAt).toBe("2024-01-02T00:00:00Z");
    expect(result.isIndexed).toBe(true);
    expect(result.resourcePath).toBe("folder/sub/file.pdf");
  });

  it("maps directory inode_type to folder", () => {
    const resource = apiResource({ inode_type: "directory" });
    const result = mapResourceToFileNode(resource);
    expect(result.type).toBe("folder");
  });

  it("uses resource_id as name when path is empty", () => {
    const resource = apiResource({
      inode_path: { path: "" },
    });
    const result = mapResourceToFileNode(resource);
    expect(result.name).toBe("res-1");
  });

  it("uses resource_id as name when path has no slashes", () => {
    const resource = apiResource({ inode_path: { path: "single" } });
    const result = mapResourceToFileNode(resource);
    expect(result.name).toBe("single");
  });

  it("falls back to created_at when updated_at is missing", () => {
    const resource = apiResource({ updated_at: undefined });
    const result = mapResourceToFileNode(resource);
    expect(result.updatedAt).toBe("2024-01-01T00:00:00Z");
  });

  it("defaults updatedAt to empty string when both timestamps missing", () => {
    const resource = apiResource({ updated_at: undefined, created_at: undefined });
    const result = mapResourceToFileNode(resource);
    expect(result.updatedAt).toBe("");
  });

  it("sets isIndexed false when status is not indexed", () => {
    const resource = apiResource({ status: "pending" });
    const result = mapResourceToFileNode(resource);
    expect(result.isIndexed).toBe(false);
  });

  it("passes parentId when provided", () => {
    const resource = apiResource();
    const result = mapResourceToFileNode(resource, "parent-folder-id");
    expect(result.parentId).toBe("parent-folder-id");
  });
});

describe("mapPaginatedApiResponseToResult", () => {
  it("maps paginated API response to PaginatedFileNodes", () => {
    const apiResponse = {
      data: [
        apiResource({ resource_id: "a", inode_path: { path: "a.pdf" } }),
        apiResource({ resource_id: "b", inode_type: "directory", inode_path: { path: "folder/b" } }),
      ],
      next_cursor: "cursor-2",
      current_cursor: "cursor-1",
    };
    const result = mapPaginatedApiResponseToResult(apiResponse, "parent-id");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("a");
    expect(result.items[0].name).toBe("a.pdf");
    expect(result.items[0].parentId).toBe("parent-id");
    expect(result.items[1].id).toBe("b");
    expect(result.items[1].type).toBe("folder");
    expect(result.nextCursor).toBe("cursor-2");
    expect(result.currentCursor).toBe("cursor-1");
  });

  it("handles empty data array", () => {
    const apiResponse = {
      data: [],
      next_cursor: null,
      current_cursor: null,
    };
    const result = mapPaginatedApiResponseToResult(apiResponse);
    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
    expect(result.currentCursor).toBeNull();
  });
});
