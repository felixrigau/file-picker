import { stackAIQueryKeys } from "@/hooks/query-keys";
import { useIndexedResourceIds, useKBActions } from "@/hooks/use-kb-actions";
import { createWrapper } from "@/test/test-utils";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/server-actions", () => ({
  getConnectionIdAction: vi.fn(),
  syncToKnowledgeBaseAction: vi.fn(),
  deleteFromKnowledgeBaseAction: vi.fn(),
}));

const actions = await import("@/app/actions/server-actions");

describe("useKBActions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.mocked(actions.getConnectionIdAction).mockResolvedValue({
      connectionId: "conn-1",
    });
    vi.mocked(actions.syncToKnowledgeBaseAction).mockResolvedValue({
      knowledge_base_id: "kb-1",
    });
    vi.mocked(actions.deleteFromKnowledgeBaseAction).mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("indexResource updates indexedIds cache optimistically before API resolves", async () => {
    let resolveSync: (value: { knowledge_base_id: string }) => void;
    const syncPromise = new Promise<{ knowledge_base_id: string }>((r) => {
      resolveSync = r;
    });
    vi.mocked(actions.syncToKnowledgeBaseAction).mockReturnValue(syncPromise);

    const { result } = renderHook(() => useKBActions(), {
      wrapper: createWrapper(queryClient),
    });

    const indexedKey = stackAIQueryKeys.indexedIds();
    expect(queryClient.getQueryData<string[]>(indexedKey)).toBeUndefined();

    act(() => {
      result.current.indexResource.mutate(["res-1", "res-2"]);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toContain("res-1");
      expect(cached).toContain("res-2");
    });

    act(() => {
      resolveSync!({ knowledge_base_id: "kb-1" });
    });
    await waitFor(() => {
      expect(result.current.indexResource.isSuccess).toBe(true);
    });
  });

  it("indexResource rolls back indexedIds on API error", async () => {
    let rejectSync: (err: Error) => void;
    const syncPromise = new Promise<{ knowledge_base_id: string }>((_, rej) => {
      rejectSync = rej;
    });
    vi.mocked(actions.syncToKnowledgeBaseAction).mockReturnValue(syncPromise);

    const { result } = renderHook(() => useKBActions(), {
      wrapper: createWrapper(queryClient),
    });

    const indexedKey = stackAIQueryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["existing"]);

    act(() => {
      result.current.indexResource.mutate(["res-new"]);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toContain("res-new");
    });

    act(() => {
      rejectSync!(new Error("API error"));
    });

    await waitFor(() => {
      expect(result.current.indexResource.isError).toBe(true);
    });

    expect(queryClient.getQueryData<string[]>(indexedKey)).toEqual([
      "existing",
    ]);
  });
});

describe("useIndexedResourceIds", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("returns empty array when no indexed ids in cache", () => {
    const { result } = renderHook(() => useIndexedResourceIds(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toEqual([]);
  });
});
