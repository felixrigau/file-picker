import type { IndexValidationResult } from "@/domain/types";
import type { FileNode } from "@/domain/types";

export function validateIndexResourceUseCase(
  node: FileNode,
): IndexValidationResult {
  if (!node?.id) {
    return { success: false, error: "Invalid resource" };
  }
  return { success: true };
}
