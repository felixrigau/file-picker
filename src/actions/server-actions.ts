"use server";

/**
 * Barrel file — re-exports all server actions for backward compatibility.
 * Actions are split by responsibility:
 * - files.actions.ts — File resources (GDrive listing, descendants)
 * - connection.actions.ts — Connection ID
 * - knowledge-base.actions.ts — Indexing, sync, delete
 */

export {
  getDescendantResourceIdsAction,
  getDescendantResourcesWithPathsAction,
  getFilesAction,
} from "./files.actions";

export { getConnectionIdAction } from "./connection.actions";

export {
  deleteFromKnowledgeBaseAction,
  deleteFromKnowledgeBaseBatchAction,
  syncToKnowledgeBaseAction,
} from "./knowledge-base.actions";
