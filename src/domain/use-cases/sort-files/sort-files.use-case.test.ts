import type { FileNode } from "@/domain/types";
import { describe, expect, it } from "vitest";
import { sortFilesUseCase } from "./sort-files.use-case";

const node = (
  id: string,
  name: string,
  type: "file" | "folder" = "file",
): FileNode => ({
  id,
  name,
  type,
  updatedAt: "",
  isIndexed: false,
});

describe("sortFilesUseCase", () => {
  it("keeps folders before files (asc)", () => {
    const files: FileNode[] = [
      node("1", "b-file", "file"),
      node("2", "a-folder", "folder"),
      node("3", "z-file", "file"),
    ];
    const result = sortFilesUseCase(files, "asc");
    expect(result[0].type).toBe("folder");
    expect(result[0].name).toBe("a-folder");
    expect(result[1].type).toBe("file");
    expect(result[2].type).toBe("file");
  });

  it("sorts folders alphabetically asc", () => {
    const files: FileNode[] = [
      node("1", "zebra", "folder"),
      node("2", "alpha", "folder"),
      node("3", "beta", "folder"),
    ];
    const result = sortFilesUseCase(files, "asc");
    expect(result.map((f) => f.name)).toEqual(["alpha", "beta", "zebra"]);
  });

  it("sorts files alphabetically asc", () => {
    const files: FileNode[] = [
      node("1", "z", "file"),
      node("2", "a", "file"),
      node("3", "m", "file"),
    ];
    const result = sortFilesUseCase(files, "asc");
    expect(result.map((f) => f.name)).toEqual(["a", "m", "z"]);
  });

  it("reverses order when desc", () => {
    const files: FileNode[] = [
      node("1", "a", "file"),
      node("2", "b", "file"),
      node("3", "c", "file"),
    ];
    const result = sortFilesUseCase(files, "desc");
    expect(result.map((f) => f.name)).toEqual(["c", "b", "a"]);
  });

  it("handles numeric names: archivo10 after archivo2", () => {
    const files: FileNode[] = [
      node("1", "archivo10", "file"),
      node("2", "archivo2", "file"),
      node("3", "archivo1", "file"),
    ];
    const result = sortFilesUseCase(files, "asc");
    expect(result.map((f) => f.name)).toEqual([
      "archivo1",
      "archivo2",
      "archivo10",
    ]);
  });

  it("does not mutate input", () => {
    const files: FileNode[] = [node("1", "b", "file"), node("2", "a", "file")];
    const orig = [...files];
    sortFilesUseCase(files, "asc");
    expect(files).toEqual(orig);
  });
});
