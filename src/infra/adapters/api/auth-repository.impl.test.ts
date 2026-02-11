import type { MockInstance } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRepositoryImpl } from "./auth-repository.impl";

vi.mock("@/infra/utils/get-env", () => ({
  getEnv: vi.fn((key: string) => {
    const env: Record<string, string> = {
      STACK_AI_EMAIL: "test@example.com",
      STACK_AI_PASSWORD: "secret",
      NEXT_PUBLIC_STACK_AI_ANON_KEY: "anon-key",
      STACK_AI_SUPABASE_AUTH_URL: "https://auth.test",
      STACK_AI_BACKEND_URL: "https://api.test",
    };
    return env[key] ?? "";
  }),
}));

type FetchMock = MockInstance<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>;

describe("AuthRepositoryImpl", () => {
  let fetchSpy: FetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, "fetch") as FetchMock;
  });

  it("getAccessToken returns token from auth API", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "jwt-token-123" }),
        { status: 200 },
      ),
    );

    const repo = new AuthRepositoryImpl();
    const token = await repo.getAccessToken();

    expect(token).toBe("jwt-token-123");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://auth.test/auth/v1/token?grant_type=password",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Apikey: "anon-key",
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining("test@example.com"),
      }),
    );
  });

  it("getAccessToken caches token on subsequent calls", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "cached-token" }),
        { status: 200 },
      ),
    );

    const repo = new AuthRepositoryImpl();
    const token1 = await repo.getAccessToken();
    const token2 = await repo.getAccessToken();

    expect(token1).toBe("cached-token");
    expect(token2).toBe("cached-token");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("getAccessToken throws when auth fails", async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ error_description: "Invalid credentials" }),
        { status: 401 },
      ),
    );

    const repo = new AuthRepositoryImpl();

    await expect(repo.getAccessToken()).rejects.toThrow("Auth failed: 401");
  });

  it("getOrganizationId returns org_id from API", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ org_id: "org-123" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const repo = new AuthRepositoryImpl();
    const orgId = await repo.getOrganizationId();

    expect(orgId).toBe("org-123");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenLastCalledWith(
      "https://api.test/organizations/me/current",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
        }),
      }),
    );
  });

  it("getOrganizationId throws when API returns error", async () => {
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token" }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response("Forbidden", { status: 403 }),
      );

    const repo = new AuthRepositoryImpl();

    await expect(repo.getOrganizationId()).rejects.toThrow(
      "API error: 403",
    );
  });
});
