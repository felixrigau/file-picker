import { FilePickerShell } from "@/components/file-picker";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold">File Picker</h1>
        <FilePickerShell />
      </main>
    </div>
  );
}
