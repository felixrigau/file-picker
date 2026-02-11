"use client";

import { TABLE_CONTENT_MIN_HEIGHT } from "@/components/file-table/constants";
import { cn } from "@/view/utils";

export interface FilePickerContentContainerProps {
  children: React.ReactNode;
}

export function FilePickerContentContainer({
  children,
}: FilePickerContentContainerProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-x-auto overflow-y-auto",
          TABLE_CONTENT_MIN_HEIGHT,
        )}
      >
        {children}
      </div>
    </div>
  );
}
