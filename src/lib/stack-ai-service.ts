/**
 * Stack AI Service — Client for the Stack AI API and Supabase Auth.
 *
 * Singleton service for GDrive connections, knowledge bases, and sync.
 * Use only on the server (API routes, Server Actions, Server Components).
 * Extended docs and examples: docs/STACK_AI_GUIDE.md
 *
 * @requires NEXT_PUBLIC_STACK_AI_ANON_KEY, STACK_AI_EMAIL, STACK_AI_PASSWORD (see .env.local)
 */

import type {
  CreateKnowledgeBasePayload,
  CreateKnowledgeBaseResponse,
  IndexingParams,
  PaginatedResponse,
  StackAIAuthResponse,
  StackAIOrgResponse,
  StackAIResource,
} from "@/types";

const SUPABASE_AUTH_URL = "https://sb.stack-ai.com";
const BACKEND_URL = "https://api.stack-ai.com";
const REQUEST_TIMEOUT_MS = 10_000;

function getEnv(key: string): string {
  const value = process.env[key];
  if (value == null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export class StackAIService {
  private static instance: StackAIService | null = null;
  private tokenPromise: Promise<string> | null = null;

  private constructor() {}

  /**
   * Returns the singleton instance.
   * @returns The single StackAIService instance
   */
  static getInstance(): StackAIService {
    if (StackAIService.instance === null) {
      StackAIService.instance = new StackAIService();
    }
    return StackAIService.instance;
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenPromise != null) {
      return this.tokenPromise;
    }
    const email = getEnv("STACK_AI_EMAIL");
    const password = getEnv("STACK_AI_PASSWORD");
    const anonKey = getEnv("NEXT_PUBLIC_STACK_AI_ANON_KEY");

    const url = `${SUPABASE_AUTH_URL}/auth/v1/token?grant_type=password`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    this.tokenPromise = fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Apikey: anonKey,
      },
      body: JSON.stringify({
        email,
        password,
        gotrue_meta_security: {},
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          const body = await res.text();
          let detail = "";
          try {
            const json = JSON.parse(body) as { message?: string; error_description?: string };
            detail = json.message ?? json.error_description ?? body;
          } catch {
            detail = body || res.statusText;
          }
          throw new Error(`Auth failed: ${res.status} ${res.statusText}. ${detail}`);
        }
        return res.json() as Promise<StackAIAuthResponse>;
      })
      .then((json) => json.access_token);

    return this.tokenPromise;
  }

  private async request<T>(
    method: string,
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAccessToken();

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "*/*");
    headers.set("User-Agent", "StackAI-Client/1.0");
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(url, {
      ...init,
      method,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Stack AI API error: ${res.status} ${res.statusText} - ${url} - ${text}`,
      );
    }

    if (res.headers.get("content-type")?.includes("application/json")) {
      return res.json() as Promise<T>;
    }
    return undefined as T;
  }

  /**
   * Fetches the current organization id (required for syncing knowledge bases).
   * @returns The organization id for the authenticated user
   * @throws Error when auth fails, required env vars are missing, or the API returns an error
   */
  async getOrganizationId(): Promise<string> {
    const url = `${BACKEND_URL}/organizations/me/current`;
    const body = await this.request<StackAIOrgResponse>("GET", url);
    return body.org_id;
  }

  /**
   * Fetches the first Google Drive connection id for the authenticated user.
   * Uses GET /v1/connections (the legacy /connections endpoint returns 404 for some orgs).
   * @returns The connection id of the first GDrive connection
   * @throws Error when auth fails, env vars are missing, no GDrive connection exists, or the API errors
   */
  async getConnectionId(): Promise<string> {
    const url = `${BACKEND_URL}/v1/connections?limit=10`;
    const response = await this.request<
      | Array<{ connection_id: string }>
      | { data?: Array<{ connection_id: string }>; results?: Array<{ connection_id: string }>; items?: Array<{ connection_id: string }> }
    >("GET", url);

    const list = Array.isArray(response)
      ? response
      : (response as { data?: unknown[] }).data ??
        (response as { results?: unknown[] }).results ??
        (response as { items?: unknown[] }).items ??
        [];

    if (list.length === 0) {
      throw new Error(
        "No Google Drive connection found. Create one in the Stack AI Workflow builder (Connections → New connection → Google Drive).",
      );
    }
    return (list[0] as { connection_id: string }).connection_id;
  }

  /**
   * Fetches resources (files/folders) from the GDrive connection.
   * Root when folderId is omitted; otherwise children of the given resource_id.
   * @param folderId - Optional resource_id to list children of (omit for root)
   * @returns Paginated list of resources (data, next_cursor, current_cursor)
   * @throws Error when auth fails, env vars are missing, or the API returns an error
   */
  async fetchGDriveContents(
    folderId?: string,
  ): Promise<PaginatedResponse<StackAIResource>> {
    const connectionId = await this.getConnectionId();
    const baseUrl = `${BACKEND_URL}/v1/connections/${connectionId}/resources/children`;
    const url = folderId
      ? `${baseUrl}?${new URLSearchParams({ resource_id: folderId }).toString()}`
      : baseUrl;
    return this.request<PaginatedResponse<StackAIResource>>("GET", url);
  }

  /**
   * Creates a knowledge base for the given connection and resources, then triggers sync.
   * @param connectionId - GDrive connection id (e.g. from getConnectionId)
   * @param resourceIds - List of resource_ids (files/folders) to index
   * @param indexingParams - Optional override for default indexing params (ocr, chunker, etc.)
   * @returns The new knowledge_base_id (use with deleteFromKnowledgeBase and similar)
   * @throws Error when auth fails, env vars are missing, or the API returns an error
   */
  async syncToKnowledgeBase(
    connectionId: string,
    resourceIds: string[],
    indexingParams?: Partial<IndexingParams>,
  ): Promise<{ knowledge_base_id: string }> {
    const orgId = await this.getOrganizationId();

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
    const createRes = await this.request<CreateKnowledgeBaseResponse>(
      "POST",
      createUrl,
      {
        body: JSON.stringify(payload),
      },
    );

    const syncUrl = `${BACKEND_URL}/knowledge_bases/sync/trigger/${createRes.knowledge_base_id}/${orgId}`;
    await this.request<unknown>("GET", syncUrl);

    return { knowledge_base_id: createRes.knowledge_base_id };
  }

  /**
   * Removes a resource from a knowledge base by path (de-indexing).
   * @param knowledgeBaseId - Id of the knowledge base (e.g. from syncToKnowledgeBase)
   * @param resourcePath - Path of the resource to remove (e.g. "papers/self_rag.pdf")
   * @throws Error when auth fails, env vars are missing, or the API returns an error
   */
  async deleteFromKnowledgeBase(
    knowledgeBaseId: string,
    resourcePath: string,
  ): Promise<void> {
    const baseUrl = `${BACKEND_URL}/knowledge_bases/${knowledgeBaseId}/resources`;
    const url = `${baseUrl}?${new URLSearchParams({ resource_path: resourcePath }).toString()}`;
    await this.request<unknown>("DELETE", url, {
      body: JSON.stringify({ resource_path: resourcePath }),
    });
  }
}

/**
 * Returns the singleton instance of the Stack AI service.
 * Use in API routes, Server Actions, or Server Components.
 * @returns The single StackAIService instance
 */
export function getStackAIService(): StackAIService {
  return StackAIService.getInstance();
}
