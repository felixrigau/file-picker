import type { FileResourceRepository } from "@/domain/ports/file-resource-repository.port";
import type { PaginatedFileNodes } from "@/domain/types";

export async function getFilesUseCase(
  fileResourceRepository: FileResourceRepository,
  folderId?: string,
): Promise<PaginatedFileNodes> {
  return fileResourceRepository.fetchContents(folderId);
}
