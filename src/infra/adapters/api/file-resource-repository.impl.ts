import type { ApiResource, PaginatedApiResponse } from "@/infra/types/api-types";
import type { HttpClient } from "../../modules/http-client";
import type { ConnectionRepository } from "@/domain/ports/connection-repository.port";
import type { FileResourceRepository } from "@/domain/ports/file-resource-repository.port";
import { mapPaginatedApiResponseToResult } from "@/infra/mappers/api-mappers";

const BACKEND_URL = "https://api.stack-ai.com";

export class FileResourceRepositoryImpl implements FileResourceRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly connectionRepository: ConnectionRepository,
  ) {}

  async fetchContents(folderId?: string) {
    const connectionId = await this.connectionRepository.getConnectionId();
    const baseUrl = `${BACKEND_URL}/v1/connections/${connectionId}/resources/children`;
    const url = folderId
      ? `${baseUrl}?${new URLSearchParams({ resource_id: folderId }).toString()}`
      : baseUrl;
    const apiResponse =
      await this.httpClient.request<PaginatedApiResponse<ApiResource>>(
        "GET",
        url,
      );
    return mapPaginatedApiResponseToResult(apiResponse, folderId);
  }

  async getDescendantIds(resourceId: string): Promise<string[]> {
    const ids = new Set<string>([resourceId]);
    try {
      const response = await this.fetchContents(resourceId);
      const children = response.items ?? [];

      for (const child of children) {
        ids.add(child.id);
        if (child.type === "folder") {
          const descendantIds = await this.getDescendantIds(child.id);
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
      const children = response.items ?? [];

      for (const child of children) {
        const path = child.resourcePath;
        if (path) {
          result.push({ resourceId: child.id, resourcePath: path });
          if (child.type === "folder") {
            const childResults = await this.getDescendantPaths(child.id, path);
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
