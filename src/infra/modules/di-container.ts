/**
 * DI Container (Dependency Injection) — composition root.
 * Wires ports with adapters. Singleton instances. Used by Server Actions (use cases).
 *
 * @see docs/DI_CONTAINER.md
 */

import { AuthRepositoryImpl } from "../adapters/api/auth-repository.impl";
import { ConnectionRepositoryImpl } from "../adapters/api/connection-repository.impl";
import { FileResourceRepositoryImpl } from "../adapters/api/file-resource-repository.impl";
import { KnowledgeBaseRepositoryImpl } from "../adapters/api/knowledge-base-repository.impl";
import { HttpClient } from "./http-client";
import type {
  AuthRepository,
  ConnectionRepository,
  FileResourceRepository,
  KnowledgeBaseRepository,
} from "@/domain/ports";

let authRepository: AuthRepository | null = null;
let httpClient: HttpClient | null = null;
let connectionRepository: ConnectionRepository | null = null;
let fileResourceRepository: FileResourceRepository | null = null;
let knowledgeBaseRepository: KnowledgeBaseRepository | null = null;

function getAuthRepository(): AuthRepository {
  if (authRepository === null) {
    authRepository = new AuthRepositoryImpl();
  }
  return authRepository;
}

function getHttpClient(): HttpClient {
  if (httpClient === null) {
    httpClient = new HttpClient();
  }
  return httpClient;
}

function getConnectionRepository(): ConnectionRepository {
  if (connectionRepository === null) {
    connectionRepository = new ConnectionRepositoryImpl(getHttpClient());
  }
  return connectionRepository;
}

function getFileResourceRepository(): FileResourceRepository {
  if (fileResourceRepository === null) {
    fileResourceRepository = new FileResourceRepositoryImpl(
      getHttpClient(),
      getConnectionRepository(),
    );
  }
  return fileResourceRepository;
}

function getKnowledgeBaseRepository(): KnowledgeBaseRepository {
  if (knowledgeBaseRepository === null) {
    knowledgeBaseRepository = new KnowledgeBaseRepositoryImpl(getHttpClient());
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
  if (overrides.authRepository != null)
    authRepository = overrides.authRepository;
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
  httpClient = null;
  connectionRepository = null;
  fileResourceRepository = null;
  knowledgeBaseRepository = null;
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
