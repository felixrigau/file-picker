import type { FileNode } from "@/domain/types";
import { describe, expect, it } from "vitest";
import { validateDeIndexResourceUseCase } from "./validate-deindex-resource.use-case";

function mockFileNode(overrides?: Partial<FileNode>): FileNode {
  return {
    id: "file-1",
    name: "test.pdf",
    type: "file",
    updatedAt: "",
    isIndexed: false,
    ...overrides,
  };
}

describe("validateDeIndexResourceUseCase", () => {
  it("returns error when knowledgeBaseId is null", () => {
    expect(
      validateDeIndexResourceUseCase(mockFileNode({ resourcePath: "path" }), null),
    ).toEqual({
      success: false,
      error: "Index a file first to enable remove",
    });
  });

  it("returns error when resourcePath is missing", () => {
    expect(
      validateDeIndexResourceUseCase(
        mockFileNode({ resourcePath: undefined }),
        "kb-1",
      ),
    ).toEqual({
      success: false,
      error: "Cannot remove: missing resource path",
    });
  });

  it("returns error when resourcePath is empty", () => {
    expect(
      validateDeIndexResourceUseCase(mockFileNode({ resourcePath: "" }), "kb-1"),
    ).toEqual({
      success: false,
      error: "Cannot remove: missing resource path",
    });
  });

  it("returns success when both kbId and resourcePath are valid", () => {
    expect(
      validateDeIndexResourceUseCase(
        mockFileNode({ resourcePath: "docs/file.pdf" }),
        "kb-1",
      ),
    ).toEqual({ success: true });
  });
});
