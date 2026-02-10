"use server";

import { mapStackAIResourceToFileNode } from "@/lib/stack-ai-mappers";
import { getStackAIService } from "@/lib/stack-ai-service";
import type {
  FileNode,
  IndexingParams,
  PaginatedResponse,
} from "@/types";

export async function getFilesAction(
  folderId?: string,
): Promise<PaginatedResponse<FileNode>> {
  const response = await getStackAIService().fetchGDriveContents(folderId);
  const data: FileNode[] = response.data.map((r) =>
    mapStackAIResourceToFileNode(r, folderId),
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
  const connectionId = await getStackAIService().getConnectionId();
  return { connectionId };
}

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>,
): Promise<{ knowledge_base_id: string }> {
  return getStackAIService().syncToKnowledgeBase(
    connectionId,
    resourceIds,
    indexingParams,
  );
}

export async function getDescendantResourceIdsAction(
  resourceId: string,
): Promise<string[]> {
  return getStackAIService().getDescendantResourceIds(resourceId);
}

export async function deleteFromKnowledgeBaseAction(
  knowledgeBaseId: string,
  resourcePath: string,
): Promise<void> {
  await getStackAIService().deleteFromKnowledgeBase(
    knowledgeBaseId,
    resourcePath,
  );
}
