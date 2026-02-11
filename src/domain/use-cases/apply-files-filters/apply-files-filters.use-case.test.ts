import type { FileNode } from "@/domain/types";
import { describe, expect, it } from "vitest";
import { applyFilesFiltersUseCase } from "./apply-files-filters.use-case";

const node = (
  id: string,
  name: string,
  type: "file" | "folder" = "file",
  isIndexed = false,
): FileNode => ({
  id,
  name,
  type,
  updatedAt: "",
  isIndexed,
});

const allParams = {
  searchQuery: "",
  status: "all" as const,
  type: "all" as const,
  indexedIds: new Set<string>(),
};

describe("applyFilesFiltersUseCase – by name", () => {
  it("returns all files when searchQuery is empty", () => {
    const files: FileNode[] = [
      node("1", "alpha.txt"),
      node("2", "beta.pdf"),
      node("3", "gamma.doc"),
    ];
    expect(
      applyFilesFiltersUseCase(files, { ...allParams, searchQuery: "" }),
    ).toEqual(files);
  });

  it("returns all files when searchQuery is only whitespace", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    expect(
      applyFilesFiltersUseCase(files, { ...allParams, searchQuery: "   " }),
    ).toEqual(files);
  });

  it("matches partial name case-insensitively", () => {
    const files: FileNode[] = [
      node("1", "Alpha Document"),
      node("2", "beta.docx"),
      node("3", "GAMMA Report"),
    ];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      searchQuery: "alpha",
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alpha Document");
  });

  it("filters by substring", () => {
    const files: FileNode[] = [
      node("1", "report-q1.pdf"),
      node("2", "report-q2.pdf"),
      node("3", "summary.docx"),
    ];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      searchQuery: "report",
    });
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual([
      "report-q1.pdf",
      "report-q2.pdf",
    ]);
  });

  it("returns empty array when no matches", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      searchQuery: "xyz",
    });
    expect(result).toEqual([]);
  });

  it("trims searchQuery before filtering", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      searchQuery: "  alpha  ",
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha.txt");
  });
});

describe("applyFilesFiltersUseCase – by status", () => {
  it("returns all files when status is all", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
    ];
    expect(
      applyFilesFiltersUseCase(files, { ...allParams, status: "all" }),
    ).toEqual(files);
  });

  it("returns only indexed when status is indexed", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
      node("3", "c", "file", false),
    ];
    const indexedIds = new Set<string>(["2"]);
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      status: "indexed",
      indexedIds,
    });
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(["1", "2"]);
  });

  it("returns only not indexed when status is not-indexed", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
    ];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      status: "not-indexed",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("handles empty indexedIds", () => {
    const files: FileNode[] = [node("1", "a", "file")];
    expect(
      applyFilesFiltersUseCase(files, {
        ...allParams,
        status: "indexed",
        indexedIds: new Set(),
      }),
    ).toEqual([]);
    expect(
      applyFilesFiltersUseCase(files, {
        ...allParams,
        status: "not-indexed",
      }),
    ).toEqual(files);
  });
});

describe("applyFilesFiltersUseCase – by type", () => {
  it("returns all files when type is all", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    expect(
      applyFilesFiltersUseCase(files, { ...allParams, type: "all" }),
    ).toEqual(files);
  });

  it("returns only folders when type is folder", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
      node("3", "c", "folder"),
    ];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      type: "folder",
    });
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.type === "folder")).toBe(true);
  });

  it("returns only files when type is file", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      type: "file",
    });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("file");
  });
});

describe("applyFilesFiltersUseCase – combined", () => {
  it("combines name + status + type with AND", () => {
    const files: FileNode[] = [
      node("1", "report-a", "folder", false),
      node("2", "report-b", "file", true),
      node("3", "report-c", "file", false),
      node("4", "other", "file", true),
    ];
    const indexedIds = new Set<string>(["2"]);
    const result = applyFilesFiltersUseCase(files, {
      searchQuery: "report",
      status: "indexed",
      type: "file",
      indexedIds,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("report-b");
  });

  it("returns empty when no matches", () => {
    const files: FileNode[] = [node("1", "alpha", "file")];
    const result = applyFilesFiltersUseCase(files, {
      ...allParams,
      searchQuery: "xyz",
    });
    expect(result).toEqual([]);
  });

  it("passes through when all filters are all/empty", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    const result = applyFilesFiltersUseCase(files, allParams);
    expect(result).toEqual(files);
  });
});
