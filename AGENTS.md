# AGENTS.md — Critical Project Context & Rules

## 🎯 Architecture Philosophy (SOLID Focus)

- **DIP (Dependency Inversion):** UI components MUST NOT call fetch or SDKs. They consume Custom Hooks. Hooks call Server Actions.
- **SRP (Single Responsibility):** - UI Components: Pure presentation + event emission.
  - Logic Helpers: Pure functions for sorting/filtering.
  - Smart Hooks: Orchestrate Server State (TanStack Query).
- **Domain vs Transport:** API types (StackAIResource) must be mapped to UI models (FileNode) at the Action or Hook level.

## 💻 Tech Stack & Boundaries

- **Core:** Next.js 16 (App Router), React 19, TS Strict.
- **Data:** TanStack Query v5 + Server Actions ("use server"). **No API Routes.**
- **UI:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **Testing:** Vitest + RTL. Mock `@/app/actions/server-actions` for hook tests.

## React/Next.js Performance

Reference `.agents/skills/vercel-react-best-practices` for waterfalls, bundle size, re-renders, and server/client patterns. 57 rules across 8 categories, prioritized by impact.

## 🛠️ Implementation Rules

### 1. React & Rendering

- **State Location:** Place state as close to the usage as possible.
- **Performance:** Use `React.memo` for expensive list items (e.g., FileRows). Prioritize "moving state down" over `useMemo`.
- **States:** Always handle `idle | loading | success | error` + `empty` states explicitly.

### 2. Tailwind & Styling

- **No Magic Numbers:** Use theme tokens. No arbitrary values (e.g., `h-[432px]`) without justification.
- **Dynamic Classes:** DO NOT use string interpolation (`text-${color}`). Use `cva` (Class Variance Authority) or static maps.
- **Class Order:** Layout -> Spacing -> Typography -> Color -> State. Use `cn()` for merging.

### 3. State Management

- **Server State:** Handled by TanStack Query. Query keys must be unique and serializable (via `query-keys.ts`).
- **Optimistic UI:** Required for Index/De-index/Delete actions. Use `onMutate` + `rollback` on error.
- **Derived State:** Never store what can be calculated. Derive `filteredFiles` from `files` + `searchQuery`.

## 📂 Project Map

- `@/app/actions/`: Entry point for Server-side logic (Wraps `StackAIService`).
- `@/hooks/`: Modular hooks (e.g., `use-gdrive-files.ts`). Exported from `index.ts`.
- `@/lib/`: Singleton services & business logic (e.g., `stack-ai-service.ts`).
- `@/types/`: Centralized domain types (Avoid `any`).

## 🧪 Testing Protocol

- Use `renderHook` + `waitFor`.
- Wrapper: `createWrapper(queryClient)` must be used.
- Clear cache: `queryClient.clear()` in `afterEach`.
