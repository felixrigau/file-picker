# API Service — Usage Guide

Client for the backend API and Supabase Auth. This guide covers setup, usage, and examples.

## Overview

The **ApiService** is a singleton that centralizes calls to the backend (GDrive connections, knowledge bases, sync). Use it only on the **server**: API routes, Server Actions, or Server Components. Do not expose credentials to the client.

## Requirements

Environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_STACK_AI_ANON_KEY` — Supabase anon key
- `STACK_AI_EMAIL` — Account email (server-side only)
- `STACK_AI_PASSWORD` — Account password (server-side only)

## Getting the Instance

```ts
import { getApiService } from "@/lib/api-service";

const service = getApiService();
```

## Examples

### List root of Google Drive

```ts
const { data } = await service.fetchGDriveContents();
// data: { data: ApiResource[], next_cursor, current_cursor }
```

### Navigate to a folder (by resource_id)

```ts
const { data } = await service.fetchGDriveContents("1YeS8H92ZmTZ3r2tLn1m43GG58gRzvYiM");
```

### Create knowledge base and index resources

```ts
const connectionId = await service.getConnectionId();
const { knowledge_base_id } = await service.syncToKnowledgeBase(connectionId, [
  "1YeS8H92ZmTZ3r2tLn1m43GG58gRzvYiM",  // folder
  "1wWBg9mJkWFJUbEdRjjjkX4jf7TYmE__GRRfAjSh6fzs",  // file
]);
```

### Remove a resource from the knowledge base

```ts
await service.deleteFromKnowledgeBase(knowledge_base_id, "papers/self_rag.pdf");
```

### With TanStack Query (API route or Server Action)

Expose the service via a Route Handler so the client can call it with TanStack Query:

```ts
// app/api/drive/route.ts
import { getApiService } from "@/lib/api-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = getApiService();
  const result = await service.fetchGDriveContents(
    searchParams.get("folderId") ?? undefined
  );
  return Response.json(result);
}
```

## API Reference

For parameter and return types, see the generated TypeDoc output in `docs/api-reference/` (run `npm run docs:generate` to build).
