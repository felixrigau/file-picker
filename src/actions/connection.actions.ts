"use server";

import { getConnectionIdUseCase } from "@/domain/use-cases";
import { getConnectionRepository } from "@/infra/modules/di-container";

export async function getConnectionIdAction(): Promise<{
  connectionId: string;
}> {
  return getConnectionIdUseCase(getConnectionRepository());
}
