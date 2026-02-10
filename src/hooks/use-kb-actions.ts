"use client";

import {
  deleteFromKnowledgeBaseAction,
  getConnectionIdAction,
  syncToKnowledgeBaseAction,
} from "@/app/actions/server-actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stackAIQueryKeys } from "./query-keys";

/** Query key for client-side indexed resource ids (optimistic + persisted). */
const INDEXED_IDS_KEY = stackAIQueryKeys.indexedIds();

/**
 * Returns the set of resource_ids currently considered indexed (for isIndexed UI).
 * Updated optimistically by indexResource / deIndexResource.
 */
export function useIndexedResourceIds(): string[] {
  const { data } = useQuery({
    queryKey: INDEXED_IDS_KEY,
    queryFn: () => [] as string[],
    initialData: [] as string[],
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
  return data ?? [];
}

/**
 * Mutations for indexing and de-indexing resources, with optimistic updates
 * so isIndexed changes in the UI before the API responds.
 */
export function useKBActions() {
  const queryClient = useQueryClient();

  const indexResource = useMutation({
    mutationFn: async (resourceIds: string[]) => {
      const { connectionId } = await getConnectionIdAction();
      return syncToKnowledgeBaseAction(connectionId, resourceIds);
    },
    onMutate: async (resourceIds) => {
      await queryClient.cancelQueries({ queryKey: INDEXED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(INDEXED_IDS_KEY);
      queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) => {
        const set = new Set(old ?? []);
        resourceIds.forEach((id) => set.add(id));
        return [...set];
      });
      return { previous };
    },
    onError: (_err, _resourceIds, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: stackAIQueryKeys.gdrive(undefined),
      });
    },
  });

  type DeIndexVariables = {
    knowledgeBaseId: string;
    resourcePath: string;
    resourceId?: string;
  };

  const deIndexResource = useMutation({
    mutationFn: async ({ knowledgeBaseId, resourcePath }: DeIndexVariables) =>
      deleteFromKnowledgeBaseAction(knowledgeBaseId, resourcePath),
    onMutate: async ({ resourceId }: DeIndexVariables) => {
      await queryClient.cancelQueries({ queryKey: INDEXED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(INDEXED_IDS_KEY);
      if (resourceId != null) {
        queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) =>
          (old ?? []).filter((id) => id !== resourceId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: stackAIQueryKeys.gdrive(undefined),
      });
    },
  });

  return { indexResource, deIndexResource };
}
