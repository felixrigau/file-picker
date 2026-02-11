"use client";

import { Button } from "@/components/ui/button";

export type FilePickerErrorVariant = "missingEnv" | "generic";

export interface FilePickerErrorProps {
  variant: FilePickerErrorVariant;
  message?: string;
  onRetry?: () => void;
}

const MISSING_ENV_CONTENT = (
  <>
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
  </>
);

export function FilePickerError({
  variant,
  message,
  onRetry,
}: FilePickerErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-muted-foreground">
      {variant === "missingEnv" ? (
        MISSING_ENV_CONTENT
      ) : (
        <>
          <p className="font-medium">Error loading files</p>
          <p className="text-sm">{message ?? "Unknown error"}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </>
      )}
    </div>
  );
}
