/**
 * Port: Auth — Access token and organization context.
 * Implementations may use Supabase, another OAuth provider, or mocks for tests.
 */
export interface AuthRepository {
  getAccessToken(): Promise<string>;
  getOrganizationId(): Promise<string>;
}
