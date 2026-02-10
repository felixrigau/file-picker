"use server";

import { mapResourceToFileNode } from "@/lib/api-mappers";
import { getApiService } from "@/lib/api-service";
import type {
  FileNode,
  IndexingParams,
  PaginatedResponse,
} from "@/types";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedResponse<FileNode>> {
  const response = await getApiService().fetchGDriveContents(folderId);
  const data: FileNode[] = response.data.map((r) =>
    mapResourceToFileNode(r, folderId),
  );
  return {
    data,
    next_cursor: response.next_cursor,
    current_cursor: response.current_cursor,
  };
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
