import type { ApplyFiltersParams } from "@/domain/types";
import type { FileNode, StatusFilter, TypeFilter } from "@/domain/types";

function extractFileExtension(filename: string): string {
  const lastSegment = filename.split(".").pop()?.toLowerCase();
  return lastSegment ?? "";
}

function filterByName(files: FileNode[], searchQuery: string): FileNode[] {
  const trimmed = searchQuery.trim();
  if (!trimmed) return files;
  const normalized = trimmed.toLowerCase();
  return files.filter((node) =>
    node.name.toLowerCase().includes(normalized),
  );
}

function filterByStatus(
  files: FileNode[],
  status: StatusFilter,
  indexedIds: Set<string>,
): FileNode[] {
  if (status === "all") return files;
  const showIndexedOnly = status === "indexed";
  return files.filter((node) => {
    const isIndexed = node.isIndexed || indexedIds.has(node.id);
    return showIndexedOnly ? isIndexed : !isIndexed;
  });
}

function filterByType(files: FileNode[], type: TypeFilter): FileNode[] {
  if (type === "all") return files;
  if (type === "folder") return files.filter((n) => n.type === "folder");
  if (type === "file") return files.filter((n) => n.type === "file");
  return files.filter(
    (n) =>
      n.type === "file" && extractFileExtension(n.name) === type,
  );
}

export function applyFilesFiltersUseCase(
  files: FileNode[],
  params: ApplyFiltersParams,
): FileNode[] {
  const afterName = filterByName(files, params.searchQuery);
  const afterStatus = filterByStatus(
    afterName,
    params.status,
    params.indexedIds,
  );
  return filterByType(afterStatus, params.type);
}
