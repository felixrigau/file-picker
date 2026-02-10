"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  indexableCount: number;
  onIndexSelected: () => void;
  onClearSelection: () => void;
  isIndexing: boolean;
}

export function FloatingSelectionBar({
  selectedCount,
  indexableCount,
  onIndexSelected,
  onClearSelection,
  isIndexing,
}: FloatingSelectionBarProps) {
  const canIndex = indexableCount > 0 && !isIndexing;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${selectedCount} items selected`}
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        "transition-opacity duration-200",
      )}
    >
      <span className="text-sm text-muted-foreground">
        {selectedCount === 1 ? "1 item selected" : `${selectedCount} items selected`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="size-4" />
        </Button>
        <Button
          size="sm"
          onClick={onIndexSelected}
          disabled={!canIndex}
          className="gap-2"
        >
          {isIndexing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Index Selected
        </Button>
      </div>
    </div>
  );
}
