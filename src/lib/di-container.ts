/**
 * DI Container (Dependency Injection) — composition root.
 * Wires ports with adapters. Singleton instances. Used by Server Actions (use cases).
 *
 * @see docs/DI_CONTAINER.md
 */

import { HttpClient } from "./http-client";
import type {
  AuthRepository,
  ConnectionRepository,
  FileResourceRepository,
  KnowledgeBaseRepository,
} from "./ports";
import { AuthRepositoryImpl } from "./adapters/auth-repository.impl";
import { ConnectionRepositoryImpl } from "./adapters/connection-repository.impl";
import { FileResourceRepositoryImpl } from "./adapters/file-resource-repository.impl";
import { KnowledgeBaseRepositoryImpl } from "./adapters/knowledge-base-repository.impl";

let authRepository: AuthRepository | null = null;
let connectionRepository: ConnectionRepository | null = null;
let fileResourceRepository: FileResourceRepository | null = null;
let knowledgeBaseRepository: KnowledgeBaseRepository | null = null;

function getAuthRepository(): AuthRepository {
  if (authRepository === null) {
    authRepository = new AuthRepositoryImpl();
  }
  return authRepository;
}

function getConnectionRepository(): ConnectionRepository {
  if (connectionRepository === null) {
    const httpClient = HttpClient.getInstance(getAuthRepository());
    connectionRepository = new ConnectionRepositoryImpl(httpClient);
  }
  return connectionRepository;
}

function getFileResourceRepository(): FileResourceRepository {
  if (fileResourceRepository === null) {
    const httpClient = HttpClient.getInstance(getAuthRepository());
    fileResourceRepository = new FileResourceRepositoryImpl(
      httpClient,
      getConnectionRepository(),
    );
  }
  return fileResourceRepository;
}

function getKnowledgeBaseRepository(): KnowledgeBaseRepository {
  if (knowledgeBaseRepository === null) {
    const httpClient = HttpClient.getInstance(getAuthRepository());
    knowledgeBaseRepository = new KnowledgeBaseRepositoryImpl(
      httpClient,
      getAuthRepository(),
    );
  }
  return knowledgeBaseRepository;
}

/** For tests: inject mock implementations. Call before any repository is used. */
export function setRepositories(overrides: {
  authRepository?: AuthRepository;
  connectionRepository?: ConnectionRepository;
  fileResourceRepository?: FileResourceRepository;
  knowledgeBaseRepository?: KnowledgeBaseRepository;
}): void {
  if (overrides.authRepository != null) authRepository = overrides.authRepository;
  if (overrides.connectionRepository != null)
    connectionRepository = overrides.connectionRepository;
  if (overrides.fileResourceRepository != null)
    fileResourceRepository = overrides.fileResourceRepository;
  if (overrides.knowledgeBaseRepository != null)
    knowledgeBaseRepository = overrides.knowledgeBaseRepository;
}

/** Reset to defaults. Use in afterEach for tests. */
export function resetRepositories(): void {
  authRepository = null;
  connectionRepository = null;
  fileResourceRepository = null;
  knowledgeBaseRepository = null;
  HttpClient.resetInstance();
}

/**
 * Composition root — explicitly wires all adapters (eager init).
 * Idempotent. Import this module at app startup so the DI Container is initialized.
 * @see docs/DI_CONTAINER.md
 */
export function bootstrapDIContainer(): void {
  getAuthRepository();
  getConnectionRepository();
  getFileResourceRepository();
  getKnowledgeBaseRepository();
}

export {
  getAuthRepository,
  getConnectionRepository,
  getFileResourceRepository,
  getKnowledgeBaseRepository,
};
