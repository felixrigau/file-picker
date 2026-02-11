import type { FileResourceRepository } from "@/domain/ports/file-resource-repository.port";

export async function getDescendantResourceIdsUseCase(
  fileResourceRepository: FileResourceRepository,
  resourceId: string,
): Promise<string[]> {
  return fileResourceRepository.getDescendantIds(resourceId);
}
