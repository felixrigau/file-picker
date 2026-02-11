import type { LucideIcon } from "lucide-react";
import { File, FileText, Table } from "lucide-react";

export interface FileIconConfig {
  Icon: LucideIcon;
  colorClass: string;
}

export const DEFAULT_FILE_ICON_CONFIG: FileIconConfig = {
  Icon: File,
  colorClass: "text-muted-foreground",
};

export const FILE_ICON_BY_EXTENSION: Record<string, FileIconConfig> = {
  pdf: { Icon: FileText, colorClass: "text-red-500" },
  csv: { Icon: Table, colorClass: "text-green-600" },
  txt: { Icon: FileText, colorClass: "text-sky-500" },
  ds_store: { Icon: File, colorClass: "text-muted-foreground" },
} as const;
