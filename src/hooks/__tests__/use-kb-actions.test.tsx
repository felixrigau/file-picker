import { stackAIQueryKeys } from "@/hooks/query-keys";
import {
  useActiveKnowledgeBaseId,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks/use-kb-actions";
import { createWrapper } from "@/test/test-utils";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/server-actions", () => ({
  getConnectionIdAction: vi.fn(),
  getDescendantResourceIdsAction: vi.fn(),
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
    vi.mocked(actions.getDescendantResourceIdsAction).mockImplementation(
      (id) => Promise.resolve([id]),
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

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-1", type: "file" },
        expandedIds: ["res-1", "res-2"],
      });
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

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-new", type: "file" },
        expandedIds: ["res-new"],
      });
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

  it("indexResource stores activeKnowledgeBaseId on success", async () => {
    const { result } = renderHook(() => useKBActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-1", type: "file" },
        expandedIds: ["res-1"],
      });
    });

    await waitFor(() => {
      expect(result.current.indexResource.isSuccess).toBe(true);
    });

    const kbKey = stackAIQueryKeys.activeKnowledgeBaseId();
    expect(queryClient.getQueryData<string>(kbKey)).toBe("kb-1");
  });

  it("deIndexResource updates indexedIds cache optimistically before API resolves", async () => {
    const indexedKey = stackAIQueryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["res-1", "res-2"]);

    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((r) => {
      resolveDelete = r;
    });
    vi.mocked(actions.deleteFromKnowledgeBaseAction).mockReturnValue(
      deletePromise,
    );

    const { result } = renderHook(() => useKBActions(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.deIndexResource.mutate({
        knowledgeBaseId: "kb-1",
        resourcePath: "folder/file.pdf",
        resourceId: "res-1",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toEqual(["res-2"]);
    });

    act(() => {
      resolveDelete!();
    });
    await waitFor(() => {
      expect(result.current.deIndexResource.isSuccess).toBe(true);
    });
  });

  it("deIndexResource rolls back indexedIds on API error", async () => {
    const indexedKey = stackAIQueryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["res-1", "res-2"]);

    let rejectDelete: (err: Error) => void;
    const deletePromise = new Promise<void>((_, rej) => {
      rejectDelete = rej;
    });
    vi.mocked(actions.deleteFromKnowledgeBaseAction).mockReturnValue(
      deletePromise,
    );

    const { result } = renderHook(() => useKBActions(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.deIndexResource.mutate({
        knowledgeBaseId: "kb-1",
        resourcePath: "folder/file.pdf",
        resourceId: "res-1",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toEqual(["res-2"]);
    });

    act(() => {
      rejectDelete!(new Error("De-index failed"));
    });

    await waitFor(() => {
      expect(result.current.deIndexResource.isError).toBe(true);
    });

    expect(queryClient.getQueryData<string[]>(indexedKey)).toEqual([
      "res-1",
      "res-2",
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

describe("useActiveKnowledgeBaseId", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("returns null when no active KB in cache", () => {
    const { result } = renderHook(() => useActiveKnowledgeBaseId(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBeNull();
  });

  it("returns cached knowledge base id when set", () => {
    const kbKey = stackAIQueryKeys.activeKnowledgeBaseId();
    queryClient.setQueryData(kbKey, "kb-123");

    const { result } = renderHook(() => useActiveKnowledgeBaseId(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe("kb-123");
  });
});
