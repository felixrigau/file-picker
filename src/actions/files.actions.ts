"use server";

import {
  getDescendantResourceIdsUseCase,
  getDescendantResourcesWithPathsUseCase,
  getFilesUseCase,
} from "@/domain/use-cases";
import { getFileResourceRepository } from "@/infra/modules/di-container";
import type { PaginatedFileNodes } from "@/domain/types";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedFileNodes> {
  return getFilesUseCase(getFileResourceRepository(), folderId);
}

export async function getDescendantResourceIdsAction(
  resourceId: string,
): Promise<string[]> {
  return getDescendantResourceIdsUseCase(
    getFileResourceRepository(),
    resourceId,
  );
}

export async function getDescendantResourcesWithPathsAction(
  resourceId: string,
  rootResourcePath: string,
): Promise<{ resourceId: string; resourcePath: string }[]> {
  return getDescendantResourcesWithPathsUseCase(
    getFileResourceRepository(),
    resourceId,
    rootResourcePath,
  );
}
