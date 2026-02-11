import type { FileNode } from "@/domain/types";
import { describe, expect, it } from "vitest";
import { validateIndexResourceUseCase } from "./validate-index-resource.use-case";

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

describe("validateIndexResourceUseCase", () => {
  it("returns success for valid node", () => {
    expect(validateIndexResourceUseCase(mockFileNode())).toEqual({
      success: true,
    });
  });

  it("returns error for node without id", () => {
    expect(validateIndexResourceUseCase(mockFileNode({ id: "" }))).toEqual({
      success: false,
      error: "Invalid resource",
    });
  });
});
