import type { ConnectionRepository } from "../../ports/connection-repository.port";

/**
 * Test implementation — returns fixed connection id. No external calls.
 */
export class ConnectionRepositoryTestImpl implements ConnectionRepository {
  constructor(private readonly connectionId = "test-connection-id") {}

  async getConnectionId(): Promise<string> {
    return this.connectionId;
  }
}
