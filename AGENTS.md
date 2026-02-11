# AGENTS.md — Critical Project Context & Rules

## 🎯 Architecture Philosophy (SOLID Focus)

- **DIP (Dependency Inversion):** UI components MUST NOT call fetch or SDKs. They consume Custom Hooks. Hooks call Server Actions.
- **SRP (Single Responsibility):** - UI Components: Pure presentation + event emission.
  - Logic Helpers: Pure functions for sorting/filtering.
  - Smart Hooks: Orchestrate Server State (TanStack Query).
- **Domain vs Transport:** API types (api.ts) must be mapped to domain types (domain.ts) at the Action layer. View (components, hooks) imports only domain types. Flow: API → Domain → View.

## 💻 Tech Stack & Boundaries

- **Core:** Next.js 16 (App Router), React 19, TS Strict.
- **Data:** TanStack Query v5 + Server Actions ("use server"). **No API Routes.**
- **UI:** Tailwind CSS, Shadcn UI, Lucide Icons.
- **Testing:** Vitest + RTL. Use DI Container with test impls (`setRepositories`) for integration tests. Unit test use cases directly with test impls.

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

- **Server State:** Handled by TanStack Query. Query keys must be unique and serializable (via `@/utils/query-keys.ts`).
- **Optimistic UI:** Required for Index/De-index/Delete actions. Use `onMutate` + `rollback` on error.
- **Derived State:** Never store what can be calculated. Derive `filteredFiles` from `files` + `searchQuery`.

## 📂 Project Map

- `@/app/actions/`: Thin wrappers that obtain repos from DI Container and call use cases.
- `@/domain/use-cases/`: Pure use cases receiving repos as parameters. Unit test these directly.
- `@/hooks/`: Modular hooks (e.g., `use-google-drive-files.ts`). Exported from `index.ts`.
- `@/utils/`: Query keys and other shared utilities (e.g., `query-keys.ts`).
- `@/infra/`: Adapters, types (API), mappers, DI Container, http-client. See docs/DI_CONTAINER.md.
- `@/domain/`: Types, ports, use cases. Domain layer.
- `@/view/`: View-layer utilities (e.g., `utils.ts` with `cn()` for Tailwind).
- `@/domain/types`: Domain types (View layer). Flow: API → Domain → View. View imports only from `@/domain/types`. Avoid `any`.
- `@/infra/types`: API (transport) types. Used only by adapters and mappers. Never import in View layer.

## 🧪 Testing Protocol

- **Integration tests:** Use DI Container — `resetRepositories()` + `setRepositories()` with test impls in `beforeEach`. Hooks/components call real server actions; repos are injected.
- **Use case unit tests:** Call use cases directly, passing test impls (e.g. `FileResourceRepositoryTestImpl`, `KnowledgeBaseRepositoryTestImpl`) as parameters.
- Use `renderHook` + `waitFor` for hook tests.
- Wrapper: `createWrapper(queryClient)` must be used.
- Clear cache: `queryClient.clear()` in `afterEach`.
