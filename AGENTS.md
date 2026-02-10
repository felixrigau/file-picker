# AGENTS.md — Project Context for AI Assistants

This document provides architectural context so you can work effectively without repeatedly reading the codebase.

## Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS** + **Shadcn UI**
- **TanStack Query** (React Query v5)
- **Vitest** + **React Testing Library** for tests

## Conventions

- **SOLID principles**
- **Functional components** only
- **Server Actions** for server-side logic (no API routes in this project)
- **Path alias**: `@/` → `src/`

## Code quality

- [SOLID design principles](https://medium.com/byborg-engineering/applying-solid-to-react-ca6d1ff926a4)
- Use of comments wherever necessary
- Proper typing of variables
- React good practices
- Minimizing unnecessary rerenders
- Next.js good practices

## UI/UX quality:

- Does everything work as expected? Are there any console errors or broken features?
- Do you have to wait for the UI? Does it make good use of optimistic updates?
- Is it intuitive?
- Does it look visually appealing?
- Any Layout Shift?**:** Measures visual stability, do things move around unexpectedly when interacting with the UI. [Learn more about CLS](https://vercel.com/docs/speed-insights/metrics#cumulative-layout-shift-cls)

---

## Architecture

```
Client (browser)                    Server (Node)
────────────────                   ────────────────
Hooks (useGDriveFiles, useKBActions)
        │
        │ call Server Actions
        ▼
Server Actions (server-actions.ts)
        │
        │ getStackAIService()
        ▼
StackAIService (stack-ai-service.ts)
        │
        ▼
Stack AI API + Supabase Auth
```

**Important**: `StackAIService` uses `STACK_AI_EMAIL` and `STACK_AI_PASSWORD` — it **must** run only on the server. Client hooks call Server Actions; Server Actions call the service.

---

## Key Files

| Path                                | Purpose                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/app/actions/server-actions.ts` | Server Actions (`"use server"`) that wrap `getStackAIService()` methods                                         |
| `src/lib/stack-ai-service.ts`       | Singleton service for Stack AI API; server-only                                                                 |
| `src/hooks/use-gdrive-files.ts`     | TanStack Query hook for GDrive file list (`folderId` optional = root)                                           |
| `src/hooks/use-kb-actions.ts`       | Mutations: `indexResource`, `deIndexResource` + `useIndexedResourceIds`; optimistic updates on `['indexedIds']` |
| `src/hooks/query-keys.ts`           | `stackAIQueryKeys.gdrive(folderId)`, `stackAIQueryKeys.indexedIds()`                                            |
| `src/types/index.ts`                | `FileNode`, `StackAIResource`, `PaginatedResponse<T>`, etc.                                                     |
| `src/test/test-utils.tsx`           | `createWrapper(client)` for tests with QueryClientProvider                                                      |

---

## Server Actions (server-actions.ts)

- `getFilesAction(folderId?)` → `fetchGDriveContents`
- `getConnectionIdAction()` → `getConnectionId`
- `syncToKnowledgeBaseAction(connectionId, resourceIds, indexingParams?)`
- `deleteFromKnowledgeBaseAction(knowledgeBaseId, resourcePath)`

---

## Testing

- **Vitest** + **RTL** (`renderHook`, `waitFor`, `act`)
- **Mock target**: `@/app/actions/server-actions` (must match the import path used by hooks)
- Tests live in `src/hooks/__tests__/`
- `createWrapper(queryClient)` for QueryClientProvider; `queryClient.clear()` in `afterEach`
- Scripts: `npm run test`, `npm run test:run`

---

## Types (src/types)

- **UI**: `FileNode`, `ApiResponse`
- **API**: `StackAIResource`, `PaginatedResponse<T>`, `InodePath`, `InodeType`
- **KB**: `IndexingParams`, `CreateKnowledgeBasePayload`, etc.

---

## Env Vars

`.env.local` template; never commit `.env.local`:

- `NEXT_PUBLIC_STACK_AI_ANON_KEY`
- `STACK_AI_EMAIL`
- `STACK_AI_PASSWORD`

---

## Docs

- `docs/STACK_AI_GUIDE.md` — usage examples (some examples may still reference API routes; project uses Server Actions now)
- `npm run docs:generate` → TypeDoc in `docs/api-reference/`

---

## Quick Reference: Adding a New Hook

1. Add Server Action in `server-actions.ts` if needed
2. Add hook in `src/hooks/` (e.g. `use-new-hook.ts`)
3. Add query key in `query-keys.ts` if applicable
4. Export from `src/hooks/index.ts`
5. Add test in `src/hooks/__tests__/` with mock of `@/app/actions/server-actions`
