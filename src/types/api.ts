/**
 * API (transport) types — Backend contract.
 * Used only by adapters and api-mappers. Never import in View layer.
 */

/** Paginated response from API (snake_case). */
export interface PaginatedApiResponse<T> {
  data: T[];
  next_cursor: string | null;
  current_cursor: string | null;
}

export interface InodePath {
  path: string;
}

export type InodeType = "directory" | "file";

export interface ApiResource {
  resource_id: string;
  inode_type: InodeType;
  inode_path: InodePath;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAuthResponse {
  access_token: string;
}

export interface ApiOrgResponse {
  org_id: string;
}

export interface ApiConnection {
  connection_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface EmbeddingParams {
  embedding_model: string;
  api_key: string | null;
}

export interface ChunkerParams {
  chunk_size: number;
  chunk_overlap: number;
  chunker: string;
}

export interface IndexingParams {
  ocr?: boolean;
  unstructured?: boolean;
  embedding_params: EmbeddingParams;
  chunker_params: ChunkerParams;
}

export interface CreateKnowledgeBasePayload {
  connection_id: string;
  connection_source_ids: string[];
  indexing_params: IndexingParams;
  org_level_role?: string | null;
  cron_job_id?: string | null;
}

export interface CreateKnowledgeBaseResponse {
  knowledge_base_id: string;
}
