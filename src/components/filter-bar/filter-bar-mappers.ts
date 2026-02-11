import {
  CheckCircle2,
  CircleOff,
  File,
  FileText,
  Folder,
  ListFilter,
  Table,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatusFilter, TypeFilter } from "@/domain/types";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  Icon: LucideIcon;
  iconClass: string;
}

export const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  {
    value: "all",
    label: "All",
    Icon: ListFilter,
    iconClass: "text-muted-foreground",
  },
  {
    value: "indexed",
    label: "Indexed",
    Icon: CheckCircle2,
    iconClass: "text-green-600",
  },
  {
    value: "not-indexed",
    label: "Not Indexed",
    Icon: CircleOff,
    iconClass: "text-muted-foreground",
  },
];

export const TYPE_OPTIONS: FilterOption<TypeFilter>[] = [
  {
    value: "all",
    label: "All",
    Icon: ListFilter,
    iconClass: "text-muted-foreground",
  },
  {
    value: "folder",
    label: "Folders",
    Icon: Folder,
    iconClass: "text-blue-500",
  },
  {
    value: "file",
    label: "Files",
    Icon: File,
    iconClass: "text-muted-foreground",
  },
  {
    value: "pdf",
    label: "PDF",
    Icon: FileText,
    iconClass: "text-red-500",
  },
  {
    value: "csv",
    label: "CSV",
    Icon: Table,
    iconClass: "text-green-600",
  },
  {
    value: "txt",
    label: "TXT",
    Icon: FileText,
    iconClass: "text-sky-500",
  },
];

export function getStatusFilterLabel(value: StatusFilter): string {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? "All";
}

export function getTypeFilterLabel(value: TypeFilter): string {
  return TYPE_OPTIONS.find((o) => o.value === value)?.label ?? "All";
}
