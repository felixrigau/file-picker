"use client";

import {
  useActiveKnowledgeBaseId,
  useGDriveFiles,
  useIndexedResourceIds,
  useKBActions,
} from "@/hooks";
import type { FileNode } from "@/types";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileTable } from "./FileTable";

/** Single breadcrumb segment: id for navigation, name for display */
interface BreadcrumbSegment {
  id: string;
  name: string;
}

/** Fixed height for the file list container to prevent CLS when data loads */
const CONTAINER_HEIGHT = "min-h-[400px] max-h-[500px]";

export function FilePickerShell() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbSegment[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const { data, isLoading, isError, error } = useGDriveFiles(currentFolderId);
  const indexedIds = useIndexedResourceIds();
  const activeKnowledgeBaseId = useActiveKnowledgeBaseId();
  const { indexNode, indexResource, deIndexResource } = useKBActions();

  const isMissingEnv =
    isError &&
    error instanceof Error &&
    error.message.includes("Missing required environment variable");

  const hasGenericError = isError && !isMissingEnv;

  /**
   * Navigates to a folder (or root when id is undefined).
   * Clears search filters on navigation.
   * When displayName is provided, appends to breadcrumb path (table navigation).
   * When navigating via breadcrumb click, truncates path to the clicked segment.
   */
  const mapsTo = useCallback(
    (id: string | undefined, displayName?: string) => {
      setSearchFilter("");

      if (id === undefined) {
        setCurrentFolderId(undefined);
        setBreadcrumbPath([]);
        return;
      }

      const existingIndex = breadcrumbPath.findIndex((s) => s.id === id);
      if (existingIndex >= 0) {
        setCurrentFolderId(id);
        setBreadcrumbPath(breadcrumbPath.slice(0, existingIndex + 1));
      } else {
        setCurrentFolderId(id);
        setBreadcrumbPath((prev) => [...prev, { id, name: displayName ?? id }]);
      }
    },
    [breadcrumbPath],
  );

  const filteredResources = useMemo(() => {
    const resources = data?.data ?? [];
    if (!searchFilter.trim()) return resources;
    const q = searchFilter.trim().toLowerCase();
    return resources.filter((node) =>
      node.name.toLowerCase().includes(q),
    );
  }, [data?.data, searchFilter]);

  const handleFolderOpen = useCallback(
    (id: string, name: string) => {
      mapsTo(id, name);
    },
    [mapsTo],
  );

  const handleIndexRequest = useCallback(
    (node: FileNode) => {
      indexNode(node);
    },
    [indexNode],
  );

  const handleDeIndexRequest = useCallback(
    (node: FileNode) => {
      if (activeKnowledgeBaseId == null) {
        toast.error("Index a file first to enable remove");
        return;
      }
      if (node.resourcePath == null) {
        toast.error("Cannot remove: missing resource path");
        return;
      }
      deIndexResource.mutate({
        knowledgeBaseId: activeKnowledgeBaseId,
        resourcePath: node.resourcePath,
        resourceId: node.id,
      });
    },
    [activeKnowledgeBaseId, deIndexResource],
  );

  const isIndexPending = useCallback(
    (resourceId: string) =>
      indexResource.isPending &&
      (indexResource.variables?.expandedIds?.includes(resourceId) ?? false),
    [indexResource.isPending, indexResource.variables],
  );

  const isDeIndexPending = useCallback(
    (resourceId: string) =>
      deIndexResource.isPending &&
      deIndexResource.variables?.resourceId === resourceId,
    [deIndexResource.isPending, deIndexResource.variables],
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => mapsTo(undefined)}
          className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Root
        </button>
        {breadcrumbPath.map((segment) => (
          <span key={segment.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => mapsTo(segment.id)}
              className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {segment.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Search (optional filter; cleared by mapsTo) */}
      <input
        type="search"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        placeholder="Filter by name..."
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {/* Fixed-height scrollable area — prevents CLS when data loads */}
      <div
        className={`${CONTAINER_HEIGHT} overflow-x-auto overflow-y-auto rounded-md border border-border`}
      >
        {isMissingEnv ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
            <p className="font-medium">Environment variables not configured</p>
            <p className="text-sm">
              Copy{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                .env.local.example
              </code>{" "}
              to{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              and fill in{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_STACK_AI_ANON_KEY
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                STACK_AI_EMAIL
              </code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                STACK_AI_PASSWORD
              </code>
              .
            </p>
          </div>
        ) : hasGenericError ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
            <p className="font-medium">Error loading files</p>
            <p className="text-sm">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : (
          <FileTable
            resources={filteredResources}
            isLoading={isLoading}
            onFolderOpen={handleFolderOpen}
            indexedIds={indexedIds}
            onIndexRequest={handleIndexRequest}
            onDeIndexRequest={handleDeIndexRequest}
            isIndexPending={isIndexPending}
            isDeIndexPending={isDeIndexPending}
          />
        )}
      </div>
    </div>
  );
}
