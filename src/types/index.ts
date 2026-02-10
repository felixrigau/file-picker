/** Status filter: indexed state relative to Knowledge Base */
export type StatusFilter = "all" | "indexed" | "not-indexed";

/** Type filter: folders, files, or extension */
export type TypeFilter =
  | "all"
  | "folder"
  | "file"
  | "pdf"
  | "csv"
  | "txt";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  updatedAt: string;
  size?: number;
  isIndexed: boolean;
  parentId?: string;
  /** Path for de-index API (from inode_path.path) */
  resourcePath?: string;
}

export interface ApiResponse {
  files: FileNode[];
}

// --- API (transport) types ---

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

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  current_cursor: string | null;
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
