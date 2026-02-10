export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType?: string;
  updatedAt: string;
  size?: number;
  isIndexed: boolean;
  parentId?: string;
}

export interface ApiResponse {
  files: FileNode[];
}

// --- Stack AI API types ---

export interface InodePath {
  path: string;
}

export type InodeType = "directory" | "file";

export interface StackAIResource {
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

export interface StackAIAuthResponse {
  access_token: string;
}

export interface StackAIOrgResponse {
  org_id: string;
}

export interface StackAIConnection {
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
