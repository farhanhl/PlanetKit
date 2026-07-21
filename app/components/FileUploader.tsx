"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { useLang } from "@/app/lib/i18n/context";

interface FileUploaderProps {
  accept: string;
  multiple?: boolean;
  label?: string;
  description?: string;
  onFiles: (files: File[]) => void;
  files?: File[];
  onRemove?: (index: number) => void;
  maxSizeMB?: number;
}

export default function FileUploader({
  accept,
  multiple = false,
  label,
  description,
  onFiles,
  files = [],
  onRemove,
  maxSizeMB = 50,
}: FileUploaderProps) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const acceptedExts = useMemo(() => accept.split(",").map((e) => e.trim().toLowerCase()), [accept]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      setError(null);

      const allFiles = Array.from(e.dataTransfer.files);
      const dropped = allFiles.filter((f) =>
        acceptedExts.some((ext) => f.name.toLowerCase().endsWith(ext))
      );

      if (allFiles.length > 0 && dropped.length === 0) {
        const exts = acceptedExts.join(", ");
        setError(`${t.invalidFile} ${exts}`);
        return;
      }

      const maxSize = maxSizeMB * 1024 * 1024;
      const oversized = dropped.find((f) => f.size > maxSize);
      if (oversized) {
        setError(t.fileTooLarge(maxSizeMB));
        return;
      }

      if (dropped.length) onFiles(dropped);
    },
    [acceptedExts, onFiles, t, maxSizeMB]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const selected = Array.from(e.target.files || []);
      const maxSize = maxSizeMB * 1024 * 1024;
      const oversized = selected.find((f) => f.size > maxSize);
      if (oversized) {
        setError(t.fileTooLarge(maxSizeMB));
        e.target.value = "";
        return;
      }
      if (selected.length) onFiles(selected);
      e.target.value = "";
    },
    [onFiles, maxSizeMB, t]
  );

  return (
    <div className="w-full">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current++;
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current--;
          if (dragCounter.current === 0) setDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all sm:p-12 ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-surface-hover/50"
        }`}
      >
        <Upload
          className={`h-10 w-10 ${dragging ? "text-accent" : "text-text-secondary"}`}
        />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {label || t.dropHere}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {description || t.orBrowse}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3"
            >
              <File className="h-4 w-4 shrink-0 text-accent" />
              <span className="flex-1 truncate text-sm text-foreground">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-text-secondary">
                {formatSize(file.size)}
              </span>
              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  className="shrink-0 rounded p-1 text-text-secondary transition-colors hover:bg-surface-hover hover:text-error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
