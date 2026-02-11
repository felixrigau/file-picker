import type { FileNode } from "@/domain/types";
import { FileResourceRepositoryTestImpl } from "@/infra/adapters/test";
import { describe, expect, it } from "vitest";
import { getFilesUseCase } from "./get-files.use-case";

function mockFileNode(
  id: string,
  name: string,
  type: "file" | "folder" = "file",
): FileNode {
  return { id, name, type, updatedAt: "", isIndexed: false };
}

describe("getFilesUseCase", () => {
  it("returns domain data from repo", async () => {
    const items = [
      mockFileNode("id1", "file1.txt"),
      mockFileNode("id2", "folder1", "folder"),
    ];
    const fileResourceRepository =
      FileResourceRepositoryTestImpl.fromFileNodes(items);

    const result = await getFilesUseCase(fileResourceRepository, undefined);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("id1");
    expect(result.items[0].name).toBe("file1.txt");
    expect(result.items[1].id).toBe("id2");
    expect(result.items[1].type).toBe("folder");
    expect(result.nextCursor).toBeNull();
  });

  it("passes folderId to repo fetchContents", async () => {
    const fileResourceRepository =
      FileResourceRepositoryTestImpl.fromFileNodes([
        mockFileNode("f1", "child"),
      ]);

    const result = await getFilesUseCase(fileResourceRepository, "folder-123");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("f1");
  });
});
