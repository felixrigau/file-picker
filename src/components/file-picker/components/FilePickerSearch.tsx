"use client";

export interface FilePickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}

export function FilePickerSearch({
  value,
  onChange,
  placeholder = "Search by...",
  "aria-label": ariaLabel,
}: FilePickerSearchProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-2/5 min-w-32 shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    />
  );
}
