/**
 * API Service — Client for the backend API and Supabase Auth.
 *
 * Singleton service for GDrive connections, knowledge bases, and sync.
 * Use only on the server (API routes, Server Actions, Server Components).
 * Extended docs and examples: docs/API_GUIDE.md
 *
 * @requires NEXT_PUBLIC_STACK_AI_ANON_KEY, STACK_AI_EMAIL, STACK_AI_PASSWORD (see .env.local)
 */

import type {
  ApiAuthResponse,
  ApiOrgResponse,
  ApiResource,
  CreateKnowledgeBasePayload,
  CreateKnowledgeBaseResponse,
  IndexingParams,
  PaginatedApiResponse,
} from "@/types/api";

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

export class ApiService {
  private static instance: ApiService | null = null;
  private tokenPromise: Promise<string> | null = null;

  private constructor() {}

  /**
   * Returns the singleton instance.
   * @returns The single ApiService instance
   */
  static getInstance(): ApiService {
    if (ApiService.instance === null) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
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
        return res.json() as Promise<ApiAuthResponse>;
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
    headers.set("User-Agent", "FilePicker-Client/1.0");
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
        `API error: ${res.status} ${res.statusText} - ${url} - ${text}`,
      );
    }

    const contentType = res.headers.get("content-type");
    const contentLength = res.headers.get("content-length");
    if (
      res.status === 204 ||
      contentLength === "0" ||
      !contentType?.includes("application/json")
    ) {
      return undefined as T;
    }

    try {
      return (await res.json()) as T;
    } catch {
      return undefined as T;
    }
  }

  /**
   * Fetches the current organization id (required for syncing knowledge bases).
   * @returns The organization id for the authenticated user
   * @throws Error when auth fails, required env vars are missing, or the API returns an error
   */
  async getOrganizationId(): Promise<string> {
    const url = `${BACKEND_URL}/organizations/me/current`;
    const body = await this.request<ApiOrgResponse>("GET", url);
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
  ): Promise<PaginatedApiResponse<ApiResource>> {
    const connectionId = await this.getConnectionId();
    const baseUrl = `${BACKEND_URL}/v1/connections/${connectionId}/resources/children`;
    const url = folderId
      ? `${baseUrl}?${new URLSearchParams({ resource_id: folderId }).toString()}`
      : baseUrl;
    return this.request<PaginatedApiResponse<ApiResource>>("GET", url);
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
   * Recursively fetches all descendant resource IDs for a folder (including the folder itself).
   * For files (no children), returns [resourceId]. Used to populate indexedIds for UI when
   * indexing a folder so all contents appear as Indexed.
   * @param resourceId - Resource id (folder or file)
   * @returns Array of resourceId + all descendant ids (for folders)
   * @throws Error when auth fails or API errors
   */
  async getDescendantResourceIds(resourceId: string): Promise<string[]> {
    const ids = new Set<string>([resourceId]);
    try {
      const response = await this.fetchGDriveContents(resourceId);
      const children = response.data ?? [];

      for (const child of children) {
        ids.add(child.resource_id);
        if (child.inode_type === "directory") {
          const descendantIds = await this.getDescendantResourceIds(
            child.resource_id,
          );
          descendantIds.forEach((id) => ids.add(id));
        }
      }
    } catch {
      // File or empty folder: return only the resource itself
    }
    return [...ids];
  }

  /**
   * Recursively fetches all descendant resources with their inode paths (for cascade de-index).
   * Includes the root resource when rootResourcePath is provided.
   * @param resourceId - Folder or file resource id
   * @param rootResourcePath - Path of the root resource (folder we're de-indexing), from UI
   * @returns Array of { resourceId, resourcePath } for de-index API calls
   */
  async getDescendantResourcesWithPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]> {
    const result: { resourceId: string; resourcePath: string }[] = [
      { resourceId, resourcePath: rootResourcePath },
    ];
    try {
      const response = await this.fetchGDriveContents(resourceId);
      const children = response.data ?? [];

      for (const child of children) {
        const path = child.inode_path?.path;
        if (path) {
          result.push({ resourceId: child.resource_id, resourcePath: path });
          if (child.inode_type === "directory") {
            const childResults = await this.getDescendantResourcesWithPaths(
              child.resource_id,
              path,
            );
            result.push(...childResults.slice(1));
          }
        }
      }
    } catch {
      // File or empty folder: only root
    }
    return result;
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
    await this.request<unknown>("DELETE", url);
  }
}

/**
 * Returns the singleton instance of the API service.
 * Use in API routes, Server Actions, or Server Components.
 * @returns The single ApiService instance
 */
export function getApiService(): ApiService {
  return ApiService.getInstance();
}
