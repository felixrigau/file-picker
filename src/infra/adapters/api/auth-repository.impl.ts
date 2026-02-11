import type { ApiAuthResponse, ApiOrgResponse } from "@/infra/types/api-types";
import type { AuthRepository } from "@/domain/ports/auth-repository.port";

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

export class AuthRepositoryImpl implements AuthRepository {
  private tokenPromise: Promise<string> | null = null;

  async getAccessToken(): Promise<string> {
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
            const json = JSON.parse(body) as {
              message?: string;
              error_description?: string;
            };
            detail = json.message ?? json.error_description ?? body;
          } catch {
            detail = body || res.statusText;
          }
          throw new Error(
            `Auth failed: ${res.status} ${res.statusText}. ${detail}`,
          );
        }
        return res.json() as Promise<ApiAuthResponse>;
      })
      .then((json) => json.access_token);

    return this.tokenPromise;
  }

  async getOrganizationId(): Promise<string> {
    const token = await this.getAccessToken();
    const url = `${BACKEND_URL}/organizations/me/current`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "*/*",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error: ${res.status} ${res.statusText} - ${text}`);
    }
    const body = (await res.json()) as ApiOrgResponse;
    return body.org_id;
  }
}
