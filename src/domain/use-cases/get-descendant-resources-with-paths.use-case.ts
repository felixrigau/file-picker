import type { FileResourceRepository } from "@/domain/ports/file-resource-repository.port";

export async function getDescendantResourcesWithPathsUseCase(
  fileResourceRepository: FileResourceRepository,
  resourceId: string,
  rootResourcePath: string,
): Promise<{ resourceId: string; resourcePath: string }[]> {
  return fileResourceRepository.getDescendantPaths(
    resourceId,
    rootResourcePath,
  );
}
