/** Centralized query keys for Stack AI–related data. */
export const stackAIQueryKeys = {
  /** GDrive contents; folderId undefined = root. */
  gdrive: (folderId: string | undefined) => ["gdrive", folderId] as const,
  /** Optimistic set of resource_ids currently indexed (for isIndexed UI). */
  indexedIds: () => ["indexedIds"] as const,
} as const;
