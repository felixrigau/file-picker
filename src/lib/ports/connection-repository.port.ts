/**
 * Port: Connection — GDrive connection id.
 * Implementations may use API, cache, or mocks for tests.
 */
export interface ConnectionRepository {
  getConnectionId(): Promise<string>;
}
