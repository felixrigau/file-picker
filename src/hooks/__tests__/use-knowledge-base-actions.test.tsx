import { queryKeys } from "@/hooks/query-keys";
import {
  useActiveKnowledgeBaseId,
  useIndexedResourceIds,
  useKnowledgeBaseActions,
} from "@/hooks/use-knowledge-base-actions";
import { createWrapper } from "@/test/test-utils";
import { QueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetRepositories, setRepositories } from "@/infra/modules/di-container";
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/infra/adapters/test";

function setupDIContainer(options: {
  knowledgeBaseRepo?: KnowledgeBaseRepositoryTestImpl;
  fileResourceRepository?: FileResourceRepositoryTestImpl;
  connectionId?: string;
} = {}): void {
  setRepositories({
    authRepository: new AuthRepositoryTestImpl(),
    connectionRepository: new ConnectionRepositoryTestImpl(
      options.connectionId ?? "conn-1",
    ),
    fileResourceRepository:
      options.fileResourceRepository ?? new FileResourceRepositoryTestImpl(),
    knowledgeBaseRepository:
      options.knowledgeBaseRepo ??
      new KnowledgeBaseRepositoryTestImpl("knowledge-base-1"),
  });
}

describe("useKnowledgeBaseActions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    resetRepositories();
    setupDIContainer();
  });

  afterEach(() => {
    queryClient.clear();
    resetRepositories();
  });

  it("indexResource updates indexedIds cache optimistically before API resolves", async () => {
    const knowledgeBaseRepo =
      KnowledgeBaseRepositoryTestImpl.withPendingSync("knowledge-base-1");
    setupDIContainer({ knowledgeBaseRepo });

    const { result } = renderHook(() => useKnowledgeBaseActions(), {
      wrapper: createWrapper(queryClient),
    });

    const indexedKey = queryKeys.indexedIds();
    expect(queryClient.getQueryData<string[]>(indexedKey)).toBeUndefined();

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-1", name: "file.pdf", type: "file" },
        expandedIds: ["res-1", "res-2"],
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toContain("res-1");
      expect(cached).toContain("res-2");
    });

    act(() => {
      knowledgeBaseRepo.resolveSync({
        knowledge_base_id: "knowledge-base-1",
      });
    });
    await waitFor(() => {
      expect(result.current.indexResource.isSuccess).toBe(true);
    });
  });

  it("indexResource rolls back indexedIds on API error", async () => {
    const knowledgeBaseRepo =
      KnowledgeBaseRepositoryTestImpl.withPendingSync("knowledge-base-1");
    setupDIContainer({ knowledgeBaseRepo });

    const { result } = renderHook(() => useKnowledgeBaseActions(), {
      wrapper: createWrapper(queryClient),
    });

    const indexedKey = queryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["existing"]);

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-new", name: "new.pdf", type: "file" },
        expandedIds: ["res-new"],
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toContain("res-new");
    });

    act(() => {
      knowledgeBaseRepo.rejectSync(new Error("API error"));
    });

    await waitFor(() => {
      expect(result.current.indexResource.isError).toBe(true);
    });

    expect(queryClient.getQueryData<string[]>(indexedKey)).toEqual([
      "existing",
    ]);
  });

  it("indexResource stores activeKnowledgeBaseId on success", async () => {
    const { result } = renderHook(() => useKnowledgeBaseActions(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.indexResource.mutate({
        node: { id: "res-1", name: "file.pdf", type: "file" },
        expandedIds: ["res-1"],
      });
    });

    await waitFor(() => {
      expect(result.current.indexResource.isSuccess).toBe(true);
    });

    const knowledgeBaseKey = queryKeys.activeKnowledgeBaseId();
    expect(queryClient.getQueryData<string>(knowledgeBaseKey)).toBe(
      "knowledge-base-1",
    );
  });

  it("deIndexResource updates indexedIds cache optimistically before API resolves", async () => {
    const knowledgeBaseRepo =
      KnowledgeBaseRepositoryTestImpl.withPendingDelete("knowledge-base-1");
    setupDIContainer({ knowledgeBaseRepo });

    const indexedKey = queryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["res-1", "res-2"]);

    const { result } = renderHook(() => useKnowledgeBaseActions(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.deIndexResource.mutate({
        knowledgeBaseId: "knowledge-base-1",
        resourcePath: "folder/file.pdf",
        resourceId: "res-1",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toEqual(["res-2"]);
    });

    act(() => {
      knowledgeBaseRepo.resolveDelete();
    });
    await waitFor(() => {
      expect(result.current.deIndexResource.isSuccess).toBe(true);
    });
  });

  it("deIndexResource rolls back indexedIds on API error", async () => {
    const knowledgeBaseRepo =
      KnowledgeBaseRepositoryTestImpl.withPendingDelete("knowledge-base-1");
    setupDIContainer({ knowledgeBaseRepo });

    const indexedKey = queryKeys.indexedIds();
    queryClient.setQueryData(indexedKey, ["res-1", "res-2"]);

    const { result } = renderHook(() => useKnowledgeBaseActions(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.deIndexResource.mutate({
        knowledgeBaseId: "knowledge-base-1",
        resourcePath: "folder/file.pdf",
        resourceId: "res-1",
      });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<string[]>(indexedKey);
      expect(cached).toEqual(["res-2"]);
    });

    act(() => {
      knowledgeBaseRepo.rejectDelete(new Error("De-index failed"));
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

  it("returns null when no active knowledge base in cache", () => {
    const { result } = renderHook(() => useActiveKnowledgeBaseId(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBeNull();
  });

  it("returns cached knowledge base id when set", () => {
    const knowledgeBaseKey = queryKeys.activeKnowledgeBaseId();
    queryClient.setQueryData(knowledgeBaseKey, "knowledge-base-123");

    const { result } = renderHook(() => useActiveKnowledgeBaseId(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe("knowledge-base-123");
  });
});
