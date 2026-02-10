"use client";

import {
  deleteFromKnowledgeBaseAction,
  deleteFromKnowledgeBaseBatchAction,
  getConnectionIdAction,
  getDescendantResourceIdsAction,
  getDescendantResourcesWithPathsAction,
  syncToKnowledgeBaseAction,
} from "@/app/actions/server-actions";
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { stackAIQueryKeys } from "./query-keys";

/** Query key for client-side indexed resource ids (optimistic + persisted). */
const INDEXED_IDS_KEY = stackAIQueryKeys.indexedIds();

const ACTIVE_KB_KEY = stackAIQueryKeys.activeKnowledgeBaseId();

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
 * Returns the active knowledge base id (set when indexing; required for de-index).
 * Client-side only; lost on refresh.
 */
export function useActiveKnowledgeBaseId(): string | null {
  const { data } = useQuery({
    queryKey: ACTIVE_KB_KEY,
    queryFn: () => null,
    initialData: null,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });
  return data ?? null;
}

/**
 * Mutations for indexing and de-indexing resources, with optimistic updates
 * so isIndexed changes in the UI before the API responds.
 * All toast feedback is managed in Hook callbacks.
 */
export function useKBActions() {
  const queryClient = useQueryClient();

  type IndexVariables = {
    /** Node to index; mutation resolves expandedIds for folders before onMutate */
    node: { id: string; name: string; type: "file" | "folder" };
    /** Resolved expanded IDs for optimistic UI (injected by indexNode wrapper) */
    expandedIds?: string[];
  };

  const indexResource = useMutation({
    mutationFn: async (variables: IndexVariables) => {
      const { connectionId } = await getConnectionIdAction();
      const resourceIds =
        variables.expandedIds ?? [variables.node.id];
      return syncToKnowledgeBaseAction(connectionId, resourceIds);
    },
    onMutate: async (variables) => {
      const expandedIds =
        variables.expandedIds ??
        (variables.node.type === "folder"
          ? await getDescendantResourceIdsAction(variables.node.id)
          : [variables.node.id]);

      await queryClient.cancelQueries({ queryKey: INDEXED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(INDEXED_IDS_KEY);
      const isFolder = variables.node.type === "folder";
      const toastId = toast.loading(
        isFolder ? "Processing folder content..." : "Indexing file...",
      );
      queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) => {
        const set = new Set(old ?? []);
        expandedIds.forEach((id) => set.add(id));
        return [...set];
      });
      return { previous, toastId, expandedIds, isFolder, folderName: variables.node.name };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
      const msg = context?.isFolder
        ? "Error indexing folder."
        : "Error indexing";
      toast.error(msg, { id: context?.toastId });
    },
    onSuccess: (result, variables, context) => {
      queryClient.setQueryData(ACTIVE_KB_KEY, result.knowledge_base_id);
      if (context?.toastId != null) {
        const msg =
          context.isFolder
            ? `All content in '${context.folderName}' has been indexed.`
            : "File indexed successfully";
        toast.success(msg, { id: context.toastId });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "gdrive",
      });
    },
  });

  type BatchIndexVariables = { resourceIds: string[]; expandedIds: string[] };

  const indexResourcesBatch = useMutation({
    mutationFn: async ({ resourceIds }: BatchIndexVariables) => {
      const { connectionId } = await getConnectionIdAction();
      return syncToKnowledgeBaseAction(connectionId, resourceIds);
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: INDEXED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(INDEXED_IDS_KEY);
      const toastId = toast.loading("Indexing selection...");
      queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) => {
        const set = new Set(old ?? []);
        variables.expandedIds.forEach((id) => set.add(id));
        return [...set];
      });
      return { previous, toastId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
      toast.error("Error indexing selection", { id: context?.toastId });
    },
    onSuccess: (result, _vars, context) => {
      queryClient.setQueryData(ACTIVE_KB_KEY, result.knowledge_base_id);
      if (context?.toastId != null) {
        toast.success("Selection indexed successfully", { id: context.toastId });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "gdrive",
      });
    },
  });

  const indexNode = useCallback(
    (node: { id: string; name: string; type: "file" | "folder" }) => {
      const run = async () => {
        const expandedIds =
          node.type === "folder"
            ? await getDescendantResourceIdsAction(node.id)
            : [node.id];
        indexResource.mutate({ node, expandedIds });
      };
      run();
    },
    [indexResource],
  );


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
      const toastId = toast.loading("Removing from index...");
      if (resourceId != null) {
        queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) =>
          (old ?? []).filter((id) => id !== resourceId),
        );
      }
      return { previous, toastId, resourceId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
      toast.error("Error removing from index", { id: context?.toastId });
    },
    onSuccess: (_result, _vars, context) => {
      if (context?.toastId != null) {
        toast.success("Removed from index", { id: context.toastId });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "gdrive",
      });
    },
  });

  type DeIndexFolderVariables = {
    knowledgeBaseId: string;
    folderName: string;
    items: { resourceId: string; resourcePath: string }[];
  };

  const deIndexFolder = useMutation({
    mutationFn: async ({
      knowledgeBaseId,
      items,
    }: DeIndexFolderVariables) =>
      deleteFromKnowledgeBaseBatchAction(knowledgeBaseId, items),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: INDEXED_IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(INDEXED_IDS_KEY);
      const toastId = toast.loading("Processing folder content...");
      const affectedIds = new Set(
        variables.items.map((i) => i.resourceId),
      );
      queryClient.setQueryData<string[]>(INDEXED_IDS_KEY, (old) =>
        (old ?? []).filter((id) => !affectedIds.has(id)),
      );
      return {
        previous,
        toastId,
        folderName: variables.folderName,
        affectedIds: variables.items.map((i) => i.resourceId),
      };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous != null) {
        queryClient.setQueryData(INDEXED_IDS_KEY, context.previous);
      }
      toast.error("Error removing folder from index.", {
        id: context?.toastId,
      });
    },
    onSuccess: (result, _vars, context) => {
      if (context?.toastId != null) {
        if (result.errorCount > 0) {
          toast.error(
            `Folder removed with ${result.errorCount} errors.`,
            { id: context.toastId },
          );
        } else {
          toast.success(
            `All content in '${context.folderName}' has been removed from index.`,
            { id: context.toastId },
          );
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "gdrive",
      });
    },
  });

  const deIndexNode = useCallback(
    (
      node: {
        id: string;
        name: string;
        type: "file" | "folder";
        resourcePath?: string;
      },
      knowledgeBaseId: string,
    ) => {
      if (node.type === "folder" && node.resourcePath) {
        const run = async () => {
          const items = await getDescendantResourcesWithPathsAction(
            node.id,
            node.resourcePath!,
          );
          deIndexFolder.mutate({
            knowledgeBaseId,
            folderName: node.name,
            items,
          });
        };
        run();
      } else if (node.type === "file" && node.resourcePath) {
        deIndexResource.mutate({
          knowledgeBaseId,
          resourcePath: node.resourcePath,
          resourceId: node.id,
        });
      }
    },
    [deIndexFolder, deIndexResource],
  );

  return {
    indexResource,
    deIndexResource,
    deIndexFolder,
    indexNode,
    deIndexNode,
    indexResourcesBatch,
  };
}
