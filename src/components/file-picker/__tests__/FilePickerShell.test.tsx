import { FilePickerShell } from "../FilePickerShell";
import { createTestQueryClient, renderWithProviders } from "@/test/test-utils";
import { queryKeys } from "@/hooks/query-keys";
import type { FileNode, PaginatedFileNodes } from "@/domain/types";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRepositories, setRepositories } from "@/infra/modules/di-container";
import {
  AuthRepositoryTestImpl,
  ConnectionRepositoryTestImpl,
  FileResourceRepositoryTestImpl,
  KnowledgeBaseRepositoryTestImpl,
} from "@/infra/adapters/test";

let searchParams = new URLSearchParams();
vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(() => "toast-id"),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (url: string) => {
      const q = url.startsWith("?") ? url.slice(1) : url;
      searchParams = new URLSearchParams(q);
    },
  }),
  useSearchParams: () => searchParams,
}));

const { toast } = await import("sonner");

function mockFileNode(
  id: string,
  name: string,
  type: "file" | "folder" = "file",
  overrides?: Partial<FileNode>,
): FileNode {
  return { id, name, type, updatedAt: "", isIndexed: false, ...overrides };
}

function setupDIContainer(options: {
  fileRepo?: FileResourceRepositoryTestImpl;
  connectionId?: string;
  kbId?: string;
  kbRepo?: KnowledgeBaseRepositoryTestImpl;
} = {}): void {
  setRepositories({
    authRepository: new AuthRepositoryTestImpl(),
    connectionRepository: new ConnectionRepositoryTestImpl(
      options.connectionId ?? "conn-1",
    ),
    fileResourceRepository:
      options.fileRepo ??
      FileResourceRepositoryTestImpl.fromFileNodes([mockFileNode("empty", "")]),
    knowledgeBaseRepository:
      options.kbRepo ?? new KnowledgeBaseRepositoryTestImpl(options.kbId ?? "kb-1"),
  });
}

describe("FilePickerShell", () => {
  beforeEach(() => {
    resetRepositories();
    searchParams = new URLSearchParams();
  });

  afterEach(() => {
    resetRepositories();
  });

  describe("Initial visualization", () => {
    it("should display folders and files returned from the service", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("folder-1", "Documents", "folder"),
          mockFileNode("folder-2", "Projects", "folder"),
          mockFileNode("file-1", "readme.pdf", "file"),
          mockFileNode("file-2", "config.json", "file"),
        ]),
      });

      renderWithProviders(<FilePickerShell />);

      expect(screen.queryByText("Documents")).not.toBeInTheDocument();
      const skeletonRows = screen.getAllByRole("row");
      expect(skeletonRows).toHaveLength(7);

      expect(await screen.findByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("readme.pdf")).toBeInTheDocument();
      expect(screen.getByText("config.json")).toBeInTheDocument();
    });

    it("should display an error message and a retry button when loading files and folders fails", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.withQueue([
          { __throw: new Error("Network error") },
        ]),
      });

      renderWithProviders(<FilePickerShell />);

      expect(
        await screen.findByText("Error loading files"),
      ).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });

  describe("Filters and sorting", () => {
    it("should only display folders when filtering by folder", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "Documents", "folder"),
          mockFileNode("f2", "readme.pdf", "file"),
        ]),
      });
      searchParams = new URLSearchParams("type=folder");

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();
      expect(screen.queryByText("readme.pdf")).not.toBeInTheDocument();
    });

    it("should only display files of a type when filtering by that file type", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "doc.pdf", "file"),
          mockFileNode("f2", "data.csv", "file"),
          mockFileNode("f3", "notes.txt", "file"),
        ]),
      });
      searchParams = new URLSearchParams("type=pdf");

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("doc.pdf")).toBeInTheDocument();
      expect(screen.queryByText("data.csv")).not.toBeInTheDocument();
      expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
    });

    it("should display only indexed files and/or folders when filtering by Indexed", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "Indexed Doc", "file", { isIndexed: true }),
          mockFileNode("f2", "Not Indexed", "file"),
        ]),
      });
      searchParams = new URLSearchParams("status=indexed");

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Indexed Doc")).toBeInTheDocument();
      expect(screen.queryByText("Not Indexed")).not.toBeInTheDocument();
    });

    it("should display only not-indexed files and/or folders when filtering by Not Indexed", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "Indexed Doc", "file", { isIndexed: true }),
          mockFileNode("f2", "Not Indexed", "file"),
        ]),
      });
      searchParams = new URLSearchParams("status=not-indexed");

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Not Indexed")).toBeInTheDocument();
      expect(screen.queryByText("Indexed Doc")).not.toBeInTheDocument();
    });

    it("should be able to clear filters after filtering", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "Documents", "folder"),
          mockFileNode("f2", "readme.pdf", "file"),
        ]),
      });
      searchParams = new URLSearchParams("type=folder");

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();
      expect(screen.queryByText("readme.pdf")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Clear all filters" }),
      );

      expect(screen.getByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("readme.pdf")).toBeInTheDocument();
    });

    it("should display only files and/or folders that match the text entered in the search input", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "alpha.pdf", "file"),
          mockFileNode("f2", "beta.txt", "file"),
          mockFileNode("f3", "alpha-backup.pdf", "file"),
        ]),
      });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("alpha.pdf")).toBeInTheDocument();
      expect(screen.getByText("alpha-backup.pdf")).toBeInTheDocument();
      expect(screen.queryByText("beta.txt")).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText("Search by...");
      fireEvent.change(searchInput, { target: { value: "alpha" } });

      expect(screen.getByText("alpha.pdf")).toBeInTheDocument();
      expect(screen.getByText("alpha-backup.pdf")).toBeInTheDocument();
      expect(screen.queryByText("beta.txt")).not.toBeInTheDocument();
    });

    it("should display files and folders sorted A-Z and after clicking the sort button, see them sorted Z-A", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes([
          mockFileNode("f1", "Alpha", "file"),
          mockFileNode("f2", "Beta", "file"),
          mockFileNode("f3", "Gamma", "file"),
        ]),
      });

      searchParams = new URLSearchParams("sortOrder=asc");
      const { rerender, queryClient } = renderWithProviders(
        <FilePickerShell />,
      );

      expect(await screen.findByText("Alpha")).toBeInTheDocument();
      let rows = screen.getAllByRole("row");
      let dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText("Alpha")).toBeInTheDocument();
      expect(within(dataRows[1]).getByText("Beta")).toBeInTheDocument();
      expect(within(dataRows[2]).getByText("Gamma")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Sort by name descending",
        }),
      );
      rerender(
        <QueryClientProvider client={queryClient}>
          <FilePickerShell />
        </QueryClientProvider>,
      );

      rows = screen.getAllByRole("row");
      dataRows = rows.slice(1);
      expect(within(dataRows[0]).getByText("Gamma")).toBeInTheDocument();
      expect(within(dataRows[1]).getByText("Beta")).toBeInTheDocument();
      expect(within(dataRows[2]).getByText("Alpha")).toBeInTheDocument();
    });
  });

  describe("Folder / children", () => {
    it("should display a skeleton of rows inside a folder when expanding that folder and then see its content", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes(
          [
            mockFileNode("folder-1", "Documents", "folder"),
            mockFileNode("file-1", "readme.pdf", "file"),
          ],
          [mockFileNode("child-1", "report.pdf", "file")],
        ),
      });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, collapsed" }),
      );

      const rowsWithSkeleton = screen.getAllByRole("row");
      expect(rowsWithSkeleton.length).toBeGreaterThanOrEqual(5);

      expect(await screen.findByText("report.pdf")).toBeInTheDocument();
    });

    it("should be able to collapse a folder and not see its content", async () => {
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes(
          [mockFileNode("folder-1", "Documents", "folder")],
          [mockFileNode("child-1", "report.pdf", "file")],
        ),
      });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, collapsed" }),
      );
      expect(await screen.findByText("report.pdf")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, expanded" }),
      );

      expect(screen.queryByText("report.pdf")).not.toBeInTheDocument();
    });

    it("should expand a folder, see the skeleton, then the content, collapse it, and when expanding again see the content directly without skeleton because it is cached", async () => {
      const fileRepo = FileResourceRepositoryTestImpl.fromFileNodes(
        [mockFileNode("folder-1", "Documents", "folder")],
        [mockFileNode("child-1", "cached-file.pdf", "file")],
      );
      setupDIContainer({ fileRepo });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, collapsed" }),
      );

      const rowsWithSkeleton = screen.getAllByRole("row");
      expect(rowsWithSkeleton.length).toBeGreaterThanOrEqual(5);

      expect(await screen.findByText("cached-file.pdf")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, expanded" }),
      );
      expect(screen.queryByText("cached-file.pdf")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Documents, folder, collapsed" }),
      );

      expect(screen.getByText("cached-file.pdf")).toBeInTheDocument();
    });
  });

  describe("Index and Remove", () => {
    beforeEach(() => {
      vi.mocked(toast.loading).mockClear();
      vi.mocked(toast.success).mockClear();
    });

    it("when clicking the Index button, should immediately change to status Indexed and show the Remove button, display an in-progress message, then a success message", async () => {
      const fileNode = mockFileNode("file-1", "document.pdf", "file", {
        resourcePath: "docs/document.pdf",
      });
      const fileRepo = FileResourceRepositoryTestImpl.fromFileNodes(
        [fileNode],
        [fileNode],
      );
      setupDIContainer({ fileRepo });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("Not indexed")).toBeInTheDocument();

      const table = screen.getByRole("table");
      const indexBtn = within(table).getByRole("button", { name: /Index/ });
      fireEvent.click(indexBtn);

      await waitFor(
        () => {
          expect(toast.loading).toHaveBeenCalledWith("Indexing file...");
          expect(screen.getByText("Indexed")).toBeInTheDocument();
          expect(
            within(table).getByRole("button", { name: /Remove/ }),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "File indexed successfully",
          expect.anything(),
        );
      });
    });

    it("when clicking the Remove button of an indexed file, should immediately change to status Not Indexed and show the Index button, then display a success message", async () => {
      const fileNode = mockFileNode("file-1", "document.pdf", "file", {
        isIndexed: false,
        resourcePath: "docs/document.pdf",
      });
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes(
          [fileNode],
          [fileNode],
        ),
      });

      const queryClient = createTestQueryClient();
      queryClient.setQueryData(
        queryKeys.activeKnowledgeBaseId(),
        "kb-1",
      );
      queryClient.setQueryData(queryKeys.indexedIds(), ["file-1"]);

      renderWithProviders(<FilePickerShell />, { queryClient });

      expect(await screen.findByText("document.pdf")).toBeInTheDocument();
      expect(screen.getByText("Indexed")).toBeInTheDocument();

      const table = screen.getByRole("table");
      const removeBtn = within(table).getByRole("button", { name: /Remove/ });
      fireEvent.click(removeBtn);

      const OPTIMISTIC_TIMEOUT_MS = 100;
      await waitFor(
        () => {
          expect(toast.loading).toHaveBeenCalledWith("Removing from index...");
          expect(screen.getByText("Not indexed")).toBeInTheDocument();
          expect(
            within(table).getByRole("button", { name: /Index/ }),
          ).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Removed from index",
          expect.anything(),
        );
      });
    });

    it("when indexing an entire folder, should immediately change to status Indexed and show the Remove button, and display a message that folder content is being processed, then a message that all folder content was indexed", async () => {
      const folderNode = mockFileNode("folder-1", "Documents", "folder", {
        resourcePath: "Documents",
      });
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes(
          [folderNode],
          [folderNode],
        ).withDescendantIds(() => ["folder-1", "file-1"]),
      });

      renderWithProviders(<FilePickerShell />);

      expect(await screen.findByText("Documents")).toBeInTheDocument();

      const table = screen.getByRole("table");
      const indexBtn = within(table).getByRole("button", { name: /Index/ });
      fireEvent.click(indexBtn);

      await waitFor(() => {
        expect(toast.loading).toHaveBeenCalledWith("Processing folder content...");
      });
      await waitFor(() => {
        expect(screen.getByText("Indexed")).toBeInTheDocument();
        expect(
          within(table).getByRole("button", { name: /Remove/ }),
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "All content in 'Documents' has been indexed.",
          expect.anything(),
        );
      });
    });

    it("when de-indexing an entire folder, should immediately change to status Not Indexed and show the Index button, display a message that folder content is being processed, then a message that all folder content was removed from index", async () => {
      const folderNode = mockFileNode("folder-1", "Documents", "folder", {
        isIndexed: false,
        resourcePath: "Documents",
      });
      setupDIContainer({
        fileRepo: FileResourceRepositoryTestImpl.fromFileNodes(
          [folderNode],
          [folderNode],
        ).withDescendantPaths(() => [
          { resourceId: "folder-1", resourcePath: "Documents" },
          { resourceId: "file-1", resourcePath: "Documents/file.pdf" },
        ]),
      });

      const queryClient = createTestQueryClient();
      queryClient.setQueryData(
        queryKeys.activeKnowledgeBaseId(),
        "kb-1",
      );
      queryClient.setQueryData(queryKeys.indexedIds(), [
        "folder-1",
        "file-1",
      ]);

      renderWithProviders(<FilePickerShell />, { queryClient });

      expect(await screen.findByText("Documents")).toBeInTheDocument();
      expect(screen.getByText("Indexed")).toBeInTheDocument();

      const table = screen.getByRole("table");
      const removeBtn = within(table).getByRole("button", { name: /Remove/ });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(toast.loading).toHaveBeenCalledWith("Processing folder content...");
      });
      await waitFor(() => {
        expect(screen.getByText("Not indexed")).toBeInTheDocument();
        expect(
          within(table).getByRole("button", { name: /Index/ }),
        ).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "All content in 'Documents' has been removed from index.",
          expect.anything(),
        );
      });
    });
  });
});
