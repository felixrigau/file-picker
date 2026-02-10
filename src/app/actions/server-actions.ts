"use server";

import { mapPaginatedApiResponseToResult } from "@/lib/api-mappers";
import { getApiService } from "@/lib/api-service";
import type { IndexingParams } from "@/types/api";
import type { FileNode, PaginatedResult } from "@/types/domain";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedResult<FileNode>> {
  const apiResponse = await getApiService().fetchGDriveContents(folderId);
  return mapPaginatedApiResponseToResult(apiResponse, folderId);
}

export async function getConnectionIdAction(): Promise<{
  connectionId: string;
}> {
  const connectionId = await getApiService().getConnectionId();
  return { connectionId };
}

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>,
): Promise<{ knowledge_base_id: string }> {
  return getApiService().syncToKnowledgeBase(
    connectionId,
    resourceIds,
    indexingParams,
  );
}

export async function getDescendantResourceIdsAction(
  resourceId: string,
): Promise<string[]> {
  return getApiService().getDescendantResourceIds(resourceId);
}

export async function getDescendantResourcesWithPathsAction(
  resourceId: string,
  rootResourcePath: string,
): Promise<{ resourceId: string; resourcePath: string }[]> {
  return getApiService().getDescendantResourcesWithPaths(
    resourceId,
    rootResourcePath,
  );
}

export async function deleteFromKnowledgeBaseAction(
  knowledgeBaseId: string,
  resourcePath: string,
): Promise<void> {
  await getApiService().deleteFromKnowledgeBase(
    knowledgeBaseId,
    resourcePath,
  );
}

export async function deleteFromKnowledgeBaseBatchAction(
  knowledgeBaseId: string,
  items: { resourceId: string; resourcePath: string }[],
): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;
  for (const { resourcePath: path } of items) {
    try {
      await getApiService().deleteFromKnowledgeBase(
        knowledgeBaseId,
        path,
      );
      successCount++;
    } catch {
      errorCount++;
    }
  }
  return { successCount, errorCount };
}
