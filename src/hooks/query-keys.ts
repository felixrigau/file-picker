/** Centralized query keys for file picker data. */
export const queryKeys = {
  /** Google Drive contents; folderId undefined = root. */
  googleDrive: (folderId: string | undefined) =>
    ["googleDrive", folderId] as const,
  /** Optimistic set of resource_ids currently indexed (for isIndexed UI). */
  indexedIds: () => ["indexedIds"] as const,
  /** Active knowledge base id (set when indexing; used for de-index). */
  activeKnowledgeBaseId: () => ["activeKnowledgeBaseId"] as const,
} as const;
