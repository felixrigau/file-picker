/** Centralized query keys for file picker data. */
export const queryKeys = {
  /** GDrive contents; folderId undefined = root. */
  gdrive: (folderId: string | undefined) => ["gdrive", folderId] as const,
  /** Optimistic set of resource_ids currently indexed (for isIndexed UI). */
  indexedIds: () => ["indexedIds"] as const,
  /** Active knowledge base id (set when indexing; used for de-index). */
  activeKnowledgeBaseId: () => ["activeKnowledgeBaseId"] as const,
} as const;
