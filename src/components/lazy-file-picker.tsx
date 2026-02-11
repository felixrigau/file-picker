"use client";

import dynamic from "next/dynamic";

const FilePickerGoogleDriveContainer = dynamic(
  () =>
    import("@/components/file-picker").then(
      (mod) => mod.FilePickerGoogleDriveContainer,
    ),
  { ssr: false },
);

export function LazyFilePicker() {
  return <FilePickerGoogleDriveContainer />;
}
