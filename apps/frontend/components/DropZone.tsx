"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/csvUtils";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
}

export function DropZone({ onFileSelected }: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0]?.errors[0]?.message;
        setError(firstError ?? "Invalid file. Please upload a CSV file.");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Only CSV files are accepted.");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File too large. Maximum size is 50MB.");
        return;
      }

      if (file.size === 0) {
        setError("The file is empty. Please upload a valid CSV.");
        return;
      }

      onFileSelected(file);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "text/plain": [".csv"],
        "application/csv": [".csv"],
      },
      maxFiles: 1,
      multiple: false,
    });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200",
          "hover:border-primary/70 hover:bg-primary/5",
          isDragActive && !isDragReject &&
            "border-primary bg-primary/10 scale-[1.01]",
          isDragReject && "border-destructive bg-destructive/10",
          !isDragActive && "border-border bg-muted/30"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4 px-8 text-center">
          {isDragReject ? (
            <AlertCircle className="w-12 h-12 text-destructive" />
          ) : (
            <div
              className={cn(
                "p-4 rounded-full transition-colors",
                isDragActive ? "bg-primary/20" : "bg-muted"
              )}
            >
              <UploadCloud
                className={cn(
                  "w-8 h-8 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
          )}

          <div>
            {isDragActive && !isDragReject ? (
              <p className="text-lg font-semibold text-primary">
                Drop your CSV file here
              </p>
            ) : isDragReject ? (
              <p className="text-lg font-semibold text-destructive">
                Invalid file type
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">
                  Drag & drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or{" "}
                  <span className="text-primary font-medium underline underline-offset-2">
                    click to browse
                  </span>
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>Supported: .csv · Max 50MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

interface SelectedFileCardProps {
  file: File;
  onRemove: () => void;
}

export function SelectedFileCard({ file, onRemove }: SelectedFileCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground truncate max-w-xs">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded"
      >
        Remove
      </button>
    </div>
  );
}
