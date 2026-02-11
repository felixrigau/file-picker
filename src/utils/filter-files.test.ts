import type { FileNode } from "@/domain/types";
import { describe, expect, it } from "vitest";
import {
  applyFilters,
  filterFilesByName,
  filterFilesByStatus,
  filterFilesByType,
} from "./filter-files";

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

describe("filterFilesByName", () => {
  it("returns all files when searchQuery is empty", () => {
    const files: FileNode[] = [
      node("1", "alpha.txt"),
      node("2", "beta.pdf"),
      node("3", "gamma.doc"),
    ];
    expect(filterFilesByName(files, "")).toEqual(files);
  });

  it("returns all files when searchQuery is only whitespace", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    expect(filterFilesByName(files, "   ")).toEqual(files);
    expect(filterFilesByName(files, "\t")).toEqual(files);
  });

  it("matches partial name case-insensitively", () => {
    const files: FileNode[] = [
      node("1", "Alpha Document"),
      node("2", "beta.docx"),
      node("3", "GAMMA Report"),
    ];
    const result = filterFilesByName(files, "alpha");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alpha Document");
  });

  it("filters by substring", () => {
    const files: FileNode[] = [
      node("1", "report-q1.pdf"),
      node("2", "report-q2.pdf"),
      node("3", "summary.docx"),
    ];
    const result = filterFilesByName(files, "report");
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.name)).toEqual(["report-q1.pdf", "report-q2.pdf"]);
  });

  it("returns empty array when no matches", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    const result = filterFilesByName(files, "xyz");
    expect(result).toEqual([]);
  });

  it("trims searchQuery before filtering", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    const result = filterFilesByName(files, "  alpha  ");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("alpha.txt");
  });

  it("does not mutate input", () => {
    const files: FileNode[] = [node("1", "alpha.txt"), node("2", "beta.pdf")];
    const orig = [...files];
    filterFilesByName(files, "alpha");
    expect(files).toEqual(orig);
  });
});

describe("filterFilesByStatus", () => {
  it("returns all files when status is all", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
    ];
    expect(filterFilesByStatus(files, "all", new Set())).toEqual(files);
  });

  it("returns only indexed when status is indexed", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
      node("3", "c", "file", false),
    ];
    const indexedIds = new Set<string>(["2"]);
    const result = filterFilesByStatus(files, "indexed", indexedIds);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.id)).toEqual(["1", "2"]);
  });

  it("returns only not indexed when status is not-indexed", () => {
    const files: FileNode[] = [
      node("1", "a", "file", true),
      node("2", "b", "file", false),
    ];
    const result = filterFilesByStatus(files, "not-indexed", new Set());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("handles empty indexedIds", () => {
    const files: FileNode[] = [node("1", "a", "file")];
    expect(filterFilesByStatus(files, "indexed", new Set())).toEqual([]);
    expect(filterFilesByStatus(files, "not-indexed", new Set())).toEqual(files);
  });
});

describe("filterFilesByType", () => {
  it("returns all files when type is all", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    expect(filterFilesByType(files, "all")).toEqual(files);
  });

  it("returns only folders when type is folder", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
      node("3", "c", "folder"),
    ];
    const result = filterFilesByType(files, "folder");
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.type === "folder")).toBe(true);
  });

  it("returns only files when type is file", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    const result = filterFilesByType(files, "file");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("file");
  });
});

describe("applyFilters", () => {
  it("combines name + status + type with AND", () => {
    const files: FileNode[] = [
      node("1", "report-a", "folder", false),
      node("2", "report-b", "file", true),
      node("3", "report-c", "file", false),
      node("4", "other", "file", true),
    ];
    const indexedIds = new Set<string>(["2"]);
    const result = applyFilters(files, {
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
    const result = applyFilters(files, {
      searchQuery: "xyz",
      status: "all",
      type: "all",
      indexedIds: new Set(),
    });
    expect(result).toEqual([]);
  });

  it("passes through when all filters are all/empty", () => {
    const files: FileNode[] = [
      node("1", "a", "folder"),
      node("2", "b", "file"),
    ];
    const result = applyFilters(files, {
      searchQuery: "",
      status: "all",
      type: "all",
      indexedIds: new Set(),
    });
    expect(result).toEqual(files);
  });
});
