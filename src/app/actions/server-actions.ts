"use server";

import { mapPaginatedApiResponseToResult } from "@/lib/api-mappers";
import {
  getConnectionRepository,
  getFileResourceRepository,
  getKnowledgeBaseRepository,
} from "@/lib/container";
import type { IndexingParams } from "@/types/api";
import type { PaginatedFileNodes } from "@/types/domain";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedFileNodes> {
  const apiResponse = await getFileResourceRepository().fetchContents(
    folderId,
  );
  return mapPaginatedApiResponseToResult(apiResponse, folderId);
}

export async function getConnectionIdAction(): Promise<{
  connectionId: string;
}> {
  const connectionId = await getConnectionRepository().getConnectionId();
  return { connectionId };
}

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>,
): Promise<{ knowledge_base_id: string }> {
  return getKnowledgeBaseRepository().sync(
    connectionId,
    resourceIds,
    indexingParams,
  );
}

export async function getDescendantResourceIdsAction(
  resourceId: string,
): Promise<string[]> {
  return getFileResourceRepository().getDescendantIds(resourceId);
}

export async function getDescendantResourcesWithPathsAction(
  resourceId: string,
  rootResourcePath: string,
): Promise<{ resourceId: string; resourcePath: string }[]> {
  return getFileResourceRepository().getDescendantPaths(
    resourceId,
    rootResourcePath,
  );
}

export async function deleteFromKnowledgeBaseAction(
  knowledgeBaseId: string,
  resourcePath: string,
): Promise<void> {
  await getKnowledgeBaseRepository().delete(knowledgeBaseId, resourcePath);
}

export async function deleteFromKnowledgeBaseBatchAction(
  knowledgeBaseId: string,
  items: { resourceId: string; resourcePath: string }[],
): Promise<{ successCount: number; errorCount: number }> {
  const knowledgeBase = getKnowledgeBaseRepository();
  let successCount = 0;
  let errorCount = 0;
  for (const { resourcePath: path } of items) {
    try {
      await knowledgeBase.delete(knowledgeBaseId, path);
      successCount++;
    } catch {
      errorCount++;
    }
  }
  return { successCount, errorCount };
}
