"use client";

import { cn } from "@/view/utils";
import { Folder } from "lucide-react";
import { getFileExtension } from "../../utils";
import {
  DEFAULT_FILE_ICON_CONFIG,
  FILE_ICON_BY_EXTENSION,
} from "./file-icon.constants";

interface FileIconProps {
  type: "file" | "folder";
  name: string;
}

export function FileIcon({ type, name }: FileIconProps) {
  if (type === "folder") {
    return (
      <span aria-hidden className="shrink-0 text-blue-500">
        <Folder className="size-4" />
      </span>
    );
  }

  const ext = getFileExtension(name);
  const config = FILE_ICON_BY_EXTENSION[ext] ?? DEFAULT_FILE_ICON_CONFIG;
  const { Icon, colorClass } = config;

  return (
    <span aria-hidden className={cn("shrink-0", colorClass)}>
      <Icon className="size-4" />
    </span>
  );
}
