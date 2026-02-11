"use client";

import { ChevronRight } from "lucide-react";

export interface BreadcrumbSegment {
  id: string;
  name: string;
}

export interface FilePickerBreadcrumbsProps {
  breadcrumbPath: BreadcrumbSegment[];
  onNavigate: (id: string | undefined, displayName?: string) => void;
}

export function FilePickerBreadcrumbs({
  breadcrumbPath,
  onNavigate,
}: FilePickerBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex shrink-0 items-center gap-2 text-sm"
    >
      <button
        type="button"
        onClick={() => onNavigate(undefined)}
        className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        Root
      </button>
      {breadcrumbPath.map((segment) => (
        <span key={segment.id} className="flex items-center gap-2">
          <ChevronRight className="size-4 text-muted-foreground" />
          <button
            type="button"
            onClick={() => onNavigate(segment.id, segment.name)}
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {segment.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
