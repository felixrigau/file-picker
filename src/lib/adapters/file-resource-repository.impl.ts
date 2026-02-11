import type {
  ApiResource,
  PaginatedApiResponse,
} from "@/types/api";
import type { ConnectionRepository } from "../ports/connection-repository.port";
import type { FileResourceRepository } from "../ports/file-resource-repository.port";
import type { HttpClient } from "../http-client";

const BACKEND_URL = "https://api.stack-ai.com";

export class FileResourceRepositoryImpl implements FileResourceRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly connectionRepository: ConnectionRepository,
  ) {}

  async fetchContents(
    folderId?: string,
  ): Promise<PaginatedApiResponse<ApiResource>> {
    const connectionId = await this.connectionRepository.getConnectionId();
    const baseUrl = `${BACKEND_URL}/v1/connections/${connectionId}/resources/children`;
    const url = folderId
      ? `${baseUrl}?${new URLSearchParams({ resource_id: folderId }).toString()}`
      : baseUrl;
    return this.httpClient.request<PaginatedApiResponse<ApiResource>>(
      "GET",
      url,
    );
  }

  async getDescendantIds(resourceId: string): Promise<string[]> {
    const ids = new Set<string>([resourceId]);
    try {
      const response = await this.fetchContents(resourceId);
      const children = response.data ?? [];

      for (const child of children) {
        ids.add(child.resource_id);
        if (child.inode_type === "directory") {
          const descendantIds = await this.getDescendantIds(
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

  async getDescendantPaths(
    resourceId: string,
    rootResourcePath: string,
  ): Promise<{ resourceId: string; resourcePath: string }[]> {
    const result: { resourceId: string; resourcePath: string }[] = [
      { resourceId, resourcePath: rootResourcePath },
    ];
    try {
      const response = await this.fetchContents(resourceId);
      const children = response.data ?? [];

      for (const child of children) {
        const path = child.inode_path?.path;
        if (path) {
          result.push({ resourceId: child.resource_id, resourcePath: path });
          if (child.inode_type === "directory") {
            const childResults = await this.getDescendantPaths(
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
}
