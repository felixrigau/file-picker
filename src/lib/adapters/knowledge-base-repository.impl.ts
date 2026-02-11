import type {
  CreateKnowledgeBasePayload,
  CreateKnowledgeBaseResponse,
  IndexingParams,
} from "@/types/api";
import type { AuthRepository } from "../ports/auth-repository.port";
import type { KnowledgeBaseRepository } from "../ports/knowledge-base-repository.port";
import type { HttpClient } from "../http-client";

const BACKEND_URL = "https://api.stack-ai.com";

export class KnowledgeBaseRepositoryImpl implements KnowledgeBaseRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authRepository: AuthRepository,
  ) {}

  async sync(
    connectionId: string,
    resourceIds: string[],
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }> {
    const orgId = await this.authRepository.getOrganizationId();

    const defaultIndexingParams: IndexingParams = {
      ocr: false,
      unstructured: true,
      embedding_params: {
        embedding_model: "text-embedding-ada-002",
        api_key: null,
      },
      chunker_params: {
        chunk_size: 1500,
        chunk_overlap: 500,
        chunker: "sentence",
      },
    };

    const payload: CreateKnowledgeBasePayload = {
      connection_id: connectionId,
      connection_source_ids: resourceIds,
      indexing_params: {
        ...defaultIndexingParams,
        ...indexingParams,
      } as IndexingParams,
      org_level_role: null,
      cron_job_id: null,
    };

    const createUrl = `${BACKEND_URL}/knowledge_bases`;
    const createRes = await this.httpClient.request<CreateKnowledgeBaseResponse>(
      "POST",
      createUrl,
      {
        body: JSON.stringify(payload),
      },
    );

    const syncUrl = `${BACKEND_URL}/knowledge_bases/sync/trigger/${createRes.knowledge_base_id}/${orgId}`;
    await this.httpClient.request<unknown>("GET", syncUrl);

    return { knowledge_base_id: createRes.knowledge_base_id };
  }

  async delete(
    knowledgeBaseId: string,
    resourcePath: string,
  ): Promise<void> {
    const baseUrl = `${BACKEND_URL}/knowledge_bases/${knowledgeBaseId}/resources`;
    const url = `${baseUrl}?${new URLSearchParams({ resource_path: resourcePath }).toString()}`;
    await this.httpClient.request<unknown>("DELETE", url);
  }
}
