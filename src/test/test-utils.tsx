import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";

/** Creates a fresh QueryClient for each test to avoid cache leakage. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Renders a hook with QueryClientProvider. Clear the passed-in client between tests (e.g. queryClient.clear()).
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
