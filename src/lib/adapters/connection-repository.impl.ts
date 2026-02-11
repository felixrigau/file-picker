import type { ConnectionRepository } from "../ports/connection-repository.port";
import type { HttpClient } from "../http-client";

const BACKEND_URL = "https://api.stack-ai.com";

type ConnectionListResponse =
  | Array<{ connection_id: string }>
  | {
      data?: Array<{ connection_id: string }>;
      results?: Array<{ connection_id: string }>;
      items?: Array<{ connection_id: string }>;
    };

export class ConnectionRepositoryImpl implements ConnectionRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getConnectionId(): Promise<string> {
    const url = `${BACKEND_URL}/v1/connections?limit=10`;
    const response = await this.httpClient.request<ConnectionListResponse>(
      "GET",
      url,
    );

    const list = Array.isArray(response)
      ? response
      : response?.data ?? response?.results ?? response?.items ?? [];

    if (list.length === 0) {
      throw new Error(
        "No Google Drive connection found. Create one in the Stack AI Workflow builder (Connections → New connection → Google Drive).",
      );
    }
    return list[0].connection_id;
  }
}
