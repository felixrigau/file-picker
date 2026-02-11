import type { ConnectionRepository } from "@/domain/ports/connection-repository.port";

export async function getConnectionIdUseCase(
  connectionRepo: ConnectionRepository,
): Promise<{ connectionId: string }> {
  const connectionId = await connectionRepo.getConnectionId();
  return { connectionId };
}
