# Container — Dependency injection and composition root

## Summary

The **container** is the composition root: the single place where port implementations are created and injected. Server Actions obtain repositories through the container; they never instantiate concrete classes.

---

## 1. Where is the container initialized?

The container is explicitly initialized at app startup:

```
app/layout.tsx  →  imports  →  lib/container.init.ts  →  calls  →  bootstrapContainer()
```

`container.init.ts` runs `bootstrapContainer()` as a side effect when imported. This creates all instances (AuthRepositoryImpl, HttpClient, ConnectionRepositoryImpl, etc.) and makes them ready to use.

- **Production:** The layout imports `@/lib/container.init` on mount → the container is initialized before any Server Action runs.
- **Tests:** Call `resetRepositories()` and `setRepositories()` in `beforeEach` so the container uses test implementations instead of real ones.

---

## 2. How does dependency injection work?

There are two flows:

### Production (default)

1. `bootstrapContainer()` creates the real implementations.
2. Server Actions call `getFileResourceRepository()`, `getConnectionRepository()`, etc.
3. The getters return the instances created during bootstrap.

### Tests (inject test implementations)

1. In `beforeEach`: call `resetRepositories()` and then `setRepositories({ ... })` with test implementations.
2. Server Actions call `get*Repository()`.
3. The getters return the injected test implementations.

`setRepositories()` replaces the container’s internal instances. It must be called **before** the first use of any `get*Repository()` in that test.

---

## 3. Flow diagram

```
                    ┌─────────────────────────────────────────┐
                    │  app/layout.tsx                         │
                    │  import "@/lib/container.init"           │
                    └──────────────────┬──────────────────────┘
                                       │ side-effect
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │  container.init.ts                      │
                    │  bootstrapContainer()                   │
                    └──────────────────┬──────────────────────┘
                                       │ creates instances
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  container.ts                                                             │
│                                                                          │
│  authRepository         = AuthRepositoryImpl()                          │
│  connectionRepository  = ConnectionRepositoryImpl(httpClient, ...)      │
│  fileResourceRepository = FileResourceRepositoryImpl(...)                │
│  knowledgeBaseRepository = KnowledgeBaseRepositoryImpl(...)              │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │ get*Repository() returns instances
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  server-actions.ts                                                       │
│  getFilesAction() → getFileResourceRepository().fetchContents(...)        │
│  getConnectionIdAction() → getConnectionRepository().getConnectionId()    │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Example: test with dependency injection

Tests use real Server Actions and inject test implementations via the container:

```ts
import { resetRepositories, setRepositories } from "@/lib/container";
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/lib/adapters/test";

beforeEach(() => {
  resetRepositories();
  setRepositories({
    authRepository: new AuthRepositoryTestImpl(),
    connectionRepository: new ConnectionRepositoryTestImpl("conn-1"),
    fileResourceRepository: FileResourceRepositoryTestImpl.withQueue([
      rootApiResponse,
      folderApiResponse,
    ]),
    knowledgeBaseRepository: new KnowledgeBaseRepositoryTestImpl("kb-1"),
  });
});

afterEach(() => {
  resetRepositories();
});

// Server Actions now use the test implementations
```

---

## 5. Container API

| Function | Usage |
|----------|-------|
| `getAuthRepository()` | Get the Auth port (used internally by other adapters) |
| `getConnectionRepository()` | Get the GDrive connections port |
| `getFileResourceRepository()` | Get the file resources port |
| `getKnowledgeBaseRepository()` | Get the knowledge base port |
| `bootstrapContainer()` | Create all instances (called from container.init) |
| `setRepositories(overrides)` | Replace implementations (for tests) |
| `resetRepositories()` | Reset to initial state (for tests) |
