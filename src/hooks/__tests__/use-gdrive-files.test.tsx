import { useGDriveFiles } from "@/hooks/use-gdrive-files";
import { createWrapper } from "@/test/test-utils";
import type { PaginatedResponse, StackAIResource } from "@/types";
import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/server-actions", () => ({
  getFilesAction: vi.fn(),
}));

const { getFilesAction } = await import("@/app/actions/server-actions");

const mockPaginated = (
  data: StackAIResource[],
): PaginatedResponse<StackAIResource> => ({
  data,
  next_cursor: null,
  current_cursor: null,
});

const mockResource = (
  id: string,
  path: string,
  inode_type: "file" | "directory" = "file",
): StackAIResource => ({
  resource_id: id,
  inode_type,
  inode_path: { path },
});

describe("useGDriveFiles", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(getFilesAction).mockReset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("returns data correctly when fetch succeeds", async () => {
    const mockData = mockPaginated([
      mockResource("id1", "file1.txt"),
      mockResource("id2", "folder1", "directory"),
    ]);
    vi.mocked(getFilesAction).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGDriveFiles(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.data?.data).toHaveLength(2);
    expect(getFilesAction).toHaveBeenCalledWith(undefined);
  });

  it("calls fetch with folderId when provided and refetches when folderId changes", async () => {
    const rootData = mockPaginated([mockResource("r1", "root.txt")]);
    const folderData = mockPaginated([mockResource("c1", "child.pdf")]);
    vi.mocked(getFilesAction)
      .mockResolvedValueOnce(rootData)
      .mockResolvedValueOnce(folderData);

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
    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data?.[0].resource_id).toBe("r1");
    expect(getFilesAction).toHaveBeenCalledWith(undefined);

    rerender({ folderId: "folder-123" });

    await waitFor(() => {
      expect(getFilesAction).toHaveBeenCalledWith("folder-123");
    });
    await waitFor(() => {
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data?.[0].resource_id).toBe("c1");
    });
  });
});
