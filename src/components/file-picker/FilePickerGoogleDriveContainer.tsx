"use client";

import { useGoogleDriveFiles, useIndexedResourceIds } from "@/hooks";
import { useState } from "react";
import { useFileActions } from "./hooks";
import { FilePicker } from "./FilePicker";

export function FilePickerGoogleDriveContainer() {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(
    undefined,
  );

  const { data, isLoading, isError, error, refetch } =
    useGoogleDriveFiles(currentFolderId);
  const indexedIdsRaw = useIndexedResourceIds();

  const indexing = useFileActions({
    isError,
    error: error instanceof Error ? error : null,
    onRefetch: refetch,
  });

  return (
    <FilePicker
      rawItems={data?.items ?? []}
      indexedIds={indexedIdsRaw}
      isLoading={isLoading}
      hasError={indexing.data.hasGenericError}
      errorMessage={indexing.data.errorMessage}
      onIndexRequest={indexing.action.handleIndex}
      onDeIndexRequest={indexing.action.handleDeIndex}
      isIndexPending={indexing.data.isIndexPending}
      isDeIndexPending={indexing.data.isDeIndexPending}
      onRefetch={indexing.action.refetch}
      onCurrentFolderChange={setCurrentFolderId}
    />
  );
}
