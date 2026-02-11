import { LazyFilePicker } from "@/components/lazy-file-picker";
import { getGoogleDriveQueryOptions } from "@/hooks/use-google-drive-files";
import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { Suspense } from "react";

function FilePickerFallback() {
  return (
    <div className="h-[80vh] flex flex-col gap-3 rounded-lg border border-border bg-card p-4" />
  );
}

async function FilePickerWithPrefetch() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery(getGoogleDriveQueryOptions(undefined));
  } catch {
    /* Prefetch is optional; client will fetch on mount if it fails */
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LazyFilePicker />
    </HydrationBoundary>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold">File Picker</h1>
        <Suspense fallback={<FilePickerFallback />}>
          <FilePickerWithPrefetch />
        </Suspense>
      </main>
    </div>
  );
}
