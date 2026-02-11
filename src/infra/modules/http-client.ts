import { AuthRepositoryImpl } from "../adapters/api/auth-repository.impl";

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Authenticated HTTP client. Uses AuthRepositoryImpl directly — no ports/adapters.
 * Adapters use HttpClient directly.
 */
export class HttpClient {
  private readonly auth = new AuthRepositoryImpl();

  async request<T>(
    method: string,
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await this.auth.getAccessToken();

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
}
