import { useGDriveFiles } from "@/hooks/use-gdrive-files";
import { createWrapper } from "@/test/test-utils";
import type { FileNode, PaginatedFileNodes } from "@/types/domain";
import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetRepositories, setRepositories } from "@/lib/di-container";
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/lib/adapters/test";

function mockFileNode(
  id: string,
  name: string,
  type: "file" | "folder" = "file",
): FileNode {
  return { id, name, type, updatedAt: "", isIndexed: false };
}

describe("useGDriveFiles", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    resetRepositories();
    setRepositories({
      authRepository: new AuthRepositoryTestImpl(),
      connectionRepository: new ConnectionRepositoryTestImpl(),
      fileResourceRepository: new FileResourceRepositoryTestImpl(),
      knowledgeBaseRepository: new KnowledgeBaseRepositoryTestImpl(),
    });
  });

  afterEach(() => {
    queryClient.clear();
    resetRepositories();
  });

  it("returns data correctly when fetch succeeds", async () => {
    const items = [
      mockFileNode("id1", "file1.txt"),
      mockFileNode("id2", "folder1", "folder"),
    ];
    setRepositories({
      fileResourceRepository: FileResourceRepositoryTestImpl.fromFileNodes(items),
    });

    const { result } = renderHook(() => useGDriveFiles(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items?.[0].id).toBe("id1");
    expect(result.current.data?.items?.[0].name).toBe("file1.txt");
    expect(result.current.data?.items?.[1].id).toBe("id2");
    expect(result.current.data?.items?.[1].type).toBe("folder");
    expect(result.current.data?.nextCursor).toBeNull();
  });

  it("calls fetch with folderId when provided and refetches when folderId changes", async () => {
    const rootData = [mockFileNode("r1", "root.txt")];
    const folderData = [mockFileNode("c1", "child.pdf")];
    setRepositories({
      fileResourceRepository: FileResourceRepositoryTestImpl.fromFileNodes(
        rootData,
        folderData,
      ),
    });

    const { result, rerender } = renderHook(
      ({ folderId }: { folderId?: string }) => useGDriveFiles(folderId),
      {
        wrapper: createWrapper(queryClient),
        initialProps: { folderId: undefined } as { folderId?: string },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items?.[0].id).toBe("r1");

    rerender({ folderId: "folder-123" });

    await waitFor(() => {
      expect(result.current.data?.items).toHaveLength(1);
      expect(result.current.data?.items?.[0].id).toBe("c1");
    });
  });
});
