# DI Container — Dependency injection and composition root

## Summary

The **DI Container** (Dependency Injection Container) is the composition root: the single place where port implementations are created and injected. Server Actions obtain repositories through the DI Container; they never instantiate concrete classes.

The DI Container, `HttpClient`, and init bootstrap live under `infra/modules/`.

---

## 1. Where is the DI Container initialized?

The DI Container is explicitly initialized at app startup:

```
app/layout.tsx  →  imports  →  infra/modules/di-container.init.ts  →  calls  →  bootstrapDIContainer()
```

`infra/modules/di-container.init.ts` runs `bootstrapDIContainer()` as a side effect when imported. This creates all instances (AuthRepositoryImpl, HttpClient, ConnectionRepositoryImpl, etc.) and makes them ready to use.

- **Production:** The layout imports `@/infra/modules/di-container.init` on mount → the DI Container is initialized before any Server Action runs.
- **Tests:** Call `resetRepositories()` and `setRepositories()` in `beforeEach` so the DI Container uses test implementations instead of real ones.

---

## 2. How does dependency injection work?

There are two flows:

### Production (default)

1. `bootstrapDIContainer()` creates the real implementations.
2. Server Actions call `getFileResourceRepository()`, `getConnectionRepository()`, etc.
3. The getters return the instances created during bootstrap.

### Tests (inject test implementations)

1. In `beforeEach`: call `resetRepositories()` and then `setRepositories({ ... })` with test implementations.
2. Server Actions call `get*Repository()`.
3. The getters return the injected test implementations.

`setRepositories()` replaces the DI Container’s internal instances. It must be called **before** the first use of any `get*Repository()` in that test.

---

## 3. Flow diagram

```
                    ┌─────────────────────────────────────────┐
                    │  app/layout.tsx                          │
                    │  import "@/infra/modules/di-container.init"        │
                    └──────────────────┬─────────────────────┘
                                        │ side-effect
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │  infra/modules/di-container.init.ts                   │
                    │  bootstrapDIContainer()                  │
                    └──────────────────┬──────────────────────┘
                                       │ creates instances
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  infra/modules/di-container.ts                                            │
│  infra/modules/http-client.ts (injected, used by adapters)                 │
│                                                                          │
│  authRepository         = AuthRepositoryImpl()                            │
│  httpClient             = HttpClient(tokenProvider: authRepository)       │
│  connectionRepository   = ConnectionRepositoryImpl(httpClient)           │
│  fileResourceRepository = FileResourceRepositoryImpl(httpClient, ...)     │
│  knowledgeBaseRepository = KnowledgeBaseRepositoryImpl(httpClient)        │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ get*Repository() returns instances
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  src/actions/ (barrel: server-actions.ts)                               │
│  files.actions.ts | connection.actions.ts | knowledge-base.actions.ts    │
│  getConnectionIdAction() → getConnectionIdUseCase(getConnectionRepo())    │
│  ...                                                                     │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │ use cases receive repos as params
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  domain/use-cases/                                                        │
│  getFilesUseCase(fileResourceRepository, folderId)                        │
│  getConnectionIdUseCase(connectionRepo)                                   │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Example: test with dependency injection

Tests use real Server Actions and inject test implementations via the DI Container:

```ts
import { resetRepositories, setRepositories } from "@/infra/modules/di-container";
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/infra/adapters/test";

beforeEach(() => {
  resetRepositories();
  setRepositories({
    authRepository: new AuthRepositoryTestImpl(),
    connectionRepository: new ConnectionRepositoryTestImpl("conn-1"),
    fileResourceRepository: FileResourceRepositoryTestImpl.fromFileNodes(
      [/* root FileNode[] */],
      [/* folder FileNode[] */],
    ),
    knowledgeBaseRepository: new KnowledgeBaseRepositoryTestImpl("kb-1"),
  });
});

afterEach(() => {
  resetRepositories();
});

// Server Actions now use the test implementations
```

---

## 5. Infra folder structure

```
src/infra/
├── adapters/        # API implementations (api/) and test doubles (test/)
├── mappers/         # api-mappers.ts (API → domain mapping)
├── modules/         # DI Container, HttpClient, init bootstrap
│   ├── di-container.ts
│   ├── di-container.init.ts
│   └── http-client.ts
├── types/           # api-types.ts (API/transport types)
└── utils/           # get-env.ts (getEnv)
```

---

## 6. DI Container API

| Function                       | Usage                                                 |
| ------------------------------ | ----------------------------------------------------- |
| `getAuthRepository()`          | Get the Auth port (used internally by other adapters) |
| `getConnectionRepository()`    | Get the GDrive connections port                       |
| `getFileResourceRepository()`  | Get the file resources port                           |
| `getKnowledgeBaseRepository()` | Get the knowledge base port                           |
| `bootstrapDIContainer()`       | Create all instances (called from infra/modules/di-container.init) |
| `setRepositories(overrides)`   | Replace implementations (for tests)                   |
| `resetRepositories()`          | Reset to initial state (for tests)                    |
