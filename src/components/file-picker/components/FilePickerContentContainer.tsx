"use client";

export interface FilePickerContentContainerProps {
  children: React.ReactNode;
}

export function FilePickerContentContainer({
  children,
}: FilePickerContentContainerProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border">
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
