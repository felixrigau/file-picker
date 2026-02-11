import type { IndexValidationResult } from "@/domain/types";
import type { FileNode } from "@/domain/types";

export function validateDeIndexResourceUseCase(
  node: FileNode,
  knowledgeBaseId: string | null,
): IndexValidationResult {
  if (knowledgeBaseId == null) {
    return { success: false, error: "Index a file first to enable remove" };
  }
  if (node.resourcePath == null || node.resourcePath === "") {
    return { success: false, error: "Cannot remove: missing resource path" };
  }
  return { success: true };
}
