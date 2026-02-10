/**
 * Central type exports.
 * Import from @/types — types are organized by domain in separate files.
 * View layer: use only domain types. API types stay in api-service / api-mappers.
 */

export type {
  FileNode,
  StatusFilter,
  TypeFilter,
  FileNodeList,
  PaginatedResult,
} from "./domain";

export type {
  PaginatedApiResponse,
  InodePath,
  InodeType,
  ApiResource,
  ApiAuthResponse,
  ApiOrgResponse,
  ApiConnection,
  EmbeddingParams,
  ChunkerParams,
  IndexingParams,
  CreateKnowledgeBasePayload,
  CreateKnowledgeBaseResponse,
} from "./api";

// API types — for lib layer only; do not import in View
