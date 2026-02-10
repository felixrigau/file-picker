import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Creates a fresh QueryClient configured for tests.
 * Disables retries to fail fast and avoid flaky tests.
 * Use a new instance per test to prevent cache leakage between tests.
 *
 * @returns A new QueryClient with retry disabled for queries and mutations
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * Creates a wrapper component that provides QueryClientProvider for hook tests.
 *
 * @param client - The QueryClient instance to provide
 * @returns A Wrapper component that wraps children with QueryClientProvider
 */
export function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Renders a hook wrapped in QueryClientProvider for unit tests.
 * Use when testing hooks that depend on TanStack Query (e.g. useQuery, useMutation).
 *
 * @param hook - The hook to render
 * @param options - Render options; pass `client` to reuse a QueryClient, or omit for a fresh one
 * @returns Result from renderHook
 *
 * @example
 * ```ts
 * const { result } = renderHookWithClient(() => useGdriveFiles(), {
 *   client: queryClient,
 * });
 * ```
 *
 * @remarks Clear the client between tests (e.g. `queryClient.clear()` in afterEach) to avoid cache leakage.
 */
export function renderHookWithClient<Result, Props>(
  hook: (props: Props) => Result,
  options: {
    client: QueryClient;
  } & Omit<RenderHookOptions<Props>, "wrapper"> = {
    client: createTestQueryClient(),
  },
) {
  const { client, ...rest } = options;
  return renderHook(hook, {
    ...rest,
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

/**
 * Options for renderWithProviders.
 *
 * @property queryClient - Optional QueryClient; a fresh one is created if not provided
 * @property [Rest] - Any valid RenderOptions from Testing Library (except wrapper)
 */
export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Renders a component wrapped in QueryClientProvider for integration tests.
 * Returns the standard render result plus the queryClient for cache setup or assertions.
 *
 * @param ui - The React element to render (e.g. <FilePickerShell />)
 * @param options - Optional; pass queryClient to share or pre-populate cache
 * @returns Render result (screen, rerender, etc.) extended with `queryClient`
 *
 * @example
 * ```ts
 * const { screen, queryClient } = renderWithProviders(<FilePickerShell />, {
 *   queryClient: createTestQueryClient(),
 * });
 * queryClient.setQueryData(stackAIQueryKeys.indexedIds(), ["file-1"]);
 * ```
 *
 * @remarks Mock `@/app/actions/server-actions` at the test file level before importing components.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;
  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
      renderOptions,
    ),
    queryClient,
  };
}
