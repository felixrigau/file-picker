import { FilePickerGoogleDriveContainer } from "@/components/file-picker";
import { Suspense } from "react";

function FilePickerFallback() {
  return (
    <div className="h-[80vh] flex flex-col gap-3 rounded-lg border border-border bg-card p-4" />
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold">File Picker</h1>
        <Suspense fallback={<FilePickerFallback />}>
          <FilePickerGoogleDriveContainer />
        </Suspense>
      </main>
    </div>
  );
}
