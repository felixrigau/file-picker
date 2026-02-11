# Repository Layer — Usage Guide

Ports & Adapters architecture for backend API access. This guide covers setup, usage, and examples.

## Overview

Data access is abstracted behind **ports** (interfaces). The **DI Container** wires adapters (implementations) and exposes them via getters. Use only on the **server**: API routes, Server Actions, or Server Components. Do not expose credentials to the client.

## Requirements

Environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_STACK_AI_ANON_KEY` — Supabase anon key
- `STACK_AI_EMAIL` — Account email (server-side only)
- `STACK_AI_PASSWORD` — Account password (server-side only)

## Getting Repositories

```ts
import {
  getConnectionRepository,
  getFileResourceRepository,
  getKnowledgeBaseRepository,
} from "@/lib/di-container";
```

## Examples

### List root of Google Drive

```ts
const fileRepo = getFileResourceRepository();
const response = await fileRepo.fetchContents();
// response: { data: ApiResource[], next_cursor, current_cursor }
```

### Navigate to a folder (by resource_id)

```ts
const response = await getFileResourceRepository().fetchContents(
  "1YeS8H92ZmTZ3r2tLn1m43GG58gRzvYiM"
);
```

### Create knowledge base and index resources

```ts
const connectionId = await getConnectionRepository().getConnectionId();
const { knowledge_base_id } = await getKnowledgeBaseRepository().sync(
  connectionId,
  [
    "1YeS8H92ZmTZ3r2tLn1m43GG58gRzvYiM",  // folder
    "1wWBg9mJkWFJUbEdRjjjkX4jf7TYmE__GRRfAjSh6fzs",  // file
  ]
);
```

### Remove a resource from the knowledge base

```ts
await getKnowledgeBaseRepository().delete(
  knowledge_base_id,
  "papers/self_rag.pdf"
);
```

### With TanStack Query (API route or Server Action)

Expose via a Route Handler so the client can call it with TanStack Query:

```ts
// app/api/drive/route.ts
import { getFileResourceRepository } from "@/lib/di-container";
import { mapPaginatedApiResponseToResult } from "@/lib/api-mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apiResponse = await getFileResourceRepository().fetchContents(
    searchParams.get("folderId") ?? undefined
  );
  const domainResult = mapPaginatedApiResponseToResult(
    apiResponse,
    searchParams.get("folderId") ?? undefined
  );
  return Response.json(domainResult);
}
```

For full details on **initialization**, **dependency injection**, and **test setup**, see [docs/DI_CONTAINER.md](./DI_CONTAINER.md).

## Test Implementations

For unit tests, use the test implementations from `@/lib/adapters/test`:

```ts
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/lib/adapters/test";
import { resetRepositories, setRepositories } from "@/lib/di-container";

beforeEach(() => {
  resetRepositories();
  setRepositories({
    authRepository: new AuthRepositoryTestImpl(),
    connectionRepository: new ConnectionRepositoryTestImpl("conn-1"),
    fileResourceRepository: FileResourceRepositoryTestImpl.fromFileNodes([
      /* your mock FileNode[] */
    ]),
    knowledgeBaseRepository: new KnowledgeBaseRepositoryTestImpl("kb-1"),
  });
});

afterEach(() => {
  resetRepositories();
});
```

## API Reference

For port definitions and types, see `src/lib/ports/` and the generated TypeDoc output in `docs/api-reference/` (run `npm run docs:generate` to build).
