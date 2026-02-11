"use client";

import { Button } from "@/components/ui/button";

export interface FilePickerErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function FilePickerError({ message, onRetry }: FilePickerErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
      <p className="font-medium">Error loading files</p>
      <p className="text-sm">{message ?? "Unknown error"}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
