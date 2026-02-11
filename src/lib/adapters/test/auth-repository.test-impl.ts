import type { AuthRepository } from "../../ports/auth-repository.port";

/**
 * Test implementation — returns fixed values. No external calls.
 * Use in tests to avoid hitting Supabase/API.
 */
export class AuthRepositoryTestImpl implements AuthRepository {
  constructor(
    private readonly accessToken = "test-token",
    private readonly organizationId = "test-org-id",
  ) {}

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }

  async getOrganizationId(): Promise<string> {
    return this.organizationId;
  }
}
