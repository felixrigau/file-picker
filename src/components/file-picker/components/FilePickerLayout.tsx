"use client";

import { cn } from "@/view/utils";

const LAYOUT_CLASSES = [
  "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
  "h-[80vh]",
] as const;

export interface FilePickerLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function FilePickerLayout({ children, className }: FilePickerLayoutProps) {
  return (
    <div className={cn(LAYOUT_CLASSES, className)}>
      {children}
    </div>
  );
}
