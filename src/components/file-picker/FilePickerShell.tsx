"use client";

import { useGDriveFiles } from "@/hooks/use-gdrive-files";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => mapsTo(undefined)}
          className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Root
        </button>
        {breadcrumbPath.map((segment) => (
          <span key={segment.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => mapsTo(segment.id)}
              className="rounded px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
        className={`${CONTAINER_HEIGHT} overflow-y-auto overflow-x-auto rounded-md border border-border`}
      >
        {isMissingEnv ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center text-muted-foreground">
            <p className="font-medium">Variables de entorno no configuradas</p>
            <p className="text-sm">
              Copia{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                .env.local.example
              </code>{" "}
              a{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              y rellena{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_STACK_AI_ANON_KEY
              </code>
              ,{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                STACK_AI_EMAIL
              </code>{" "}
              y{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                STACK_AI_PASSWORD
              </code>
              .
            </p>
          </div>
        ) : hasGenericError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center text-muted-foreground">
            <p className="font-medium">Error al cargar los archivos</p>
            <p className="text-sm">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </div>
        ) : (
          <FileTable
            resources={filteredResources}
            isLoading={isLoading}
            onFolderOpen={handleFolderOpen}
          />
        )}
      </div>
    </div>
  );
}
