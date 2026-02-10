"use server";

import { getStackAIService } from "@/lib/stack-ai-service";
import type { IndexingParams, PaginatedResponse, StackAIResource } from "@/types";

export async function getFilesAction(
  folderId?: string
): Promise<PaginatedResponse<StackAIResource>> {
  return getStackAIService().fetchGDriveContents(folderId);
}

export async function getConnectionIdAction(): Promise<{ connectionId: string }> {
  const connectionId = await getStackAIService().getConnectionId();
  return { connectionId };
}

export async function syncToKnowledgeBaseAction(
  connectionId: string,
  resourceIds: string[],
  indexingParams?: Partial<IndexingParams>
): Promise<{ knowledge_base_id: string }> {
  return getStackAIService().syncToKnowledgeBase(
    connectionId,
    resourceIds,
    indexingParams
  );
}

export async function deleteFromKnowledgeBaseAction(
  knowledgeBaseId: string,
  resourcePath: string
): Promise<void> {
  await getStackAIService().deleteFromKnowledgeBase(
    knowledgeBaseId,
    resourcePath
  );
}
