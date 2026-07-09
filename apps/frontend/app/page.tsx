"use client";

import { useState, useCallback } from "react";
import { DropZone, SelectedFileCard } from "@/components/DropZone";
import { PreviewTable } from "@/components/PreviewTable";
import { ProcessingView } from "@/components/ProcessingView";
import { ResultsView } from "@/components/ResultsView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { parseCSVForPreview } from "@/lib/csvUtils";
import { uploadCSVForImport } from "@/lib/api";
import type { AppStep, ImportResult, ProgressState } from "@/types";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

const PROCESSING_STEPS = [
  "Uploading CSV...",
  "Parsing CSV...",
  "Sending to AI...",
  "AI Extracting fields...",
  "Processing results...",
  "Import complete!",
];

export default function HomePage() {
  const [step, setStep] = useState<AppStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    message: "",
    current: 0,
    total: 1,
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsingPreview, setIsParsingPreview] = useState(false);

  const handleFileSelected = useCallback(
    async (selectedFile: File) => {
      setError(null);
      setFile(selectedFile);
      setIsParsingPreview(true);

      try {
        const parsed = await parseCSVForPreview(selectedFile);
        setPreviewData(parsed);
        setStep("preview");

        // ✅ CSV loaded
        toast.success("CSV loaded", {
          description: `${parsed.totalRows} rows · ${parsed.headers.length} columns ready to preview`,
          duration: 3000,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to parse CSV file.";
        setError(message);
        setFile(null);

        // ❌ Parse failure
        toast.error("Failed to read CSV", {
          description: message,
          duration: 5000,
        });
      } finally {
        setIsParsingPreview(false);
      }
    },
    []
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setStep("upload");

    // ℹ️ File removed
    toast.info("File removed", {
      description: "Upload a new CSV to start over",
      duration: 2500,
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;

    setError(null);
    setStep("processing");

    // Simulate progress steps while waiting for the API
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < PROCESSING_STEPS.length - 1) {
        stepIdx++;
        setProgress({
          message: PROCESSING_STEPS[stepIdx],
          current: stepIdx,
          total: PROCESSING_STEPS.length - 1,
        });
      }
    }, 800);

    setProgress({
      message: PROCESSING_STEPS[0],
      current: 0,
      total: PROCESSING_STEPS.length - 1,
    });

    // ℹ️ Import started
    toast.info("Import started", {
      description: "AI is extracting CRM fields from your CSV…",
      duration: 3000,
    });

    try {
      const response = await uploadCSVForImport(file);

      clearInterval(stepInterval);

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Import failed");
      }

      setProgress({
        message: "Import complete!",
        current: PROCESSING_STEPS.length - 1,
        total: PROCESSING_STEPS.length - 1,
      });

      // Brief pause to show completion
      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = response.data;
      setImportResult(result);
      setStep("results");

      // ✅ Import complete
      if (result.totalSkipped === 0) {
        toast.success("Import complete", {
          description: `All ${result.totalImported} records imported successfully`,
          duration: 5000,
        });
      } else {
        toast.warning("Import complete with skipped rows", {
          description: `${result.totalImported} imported · ${result.totalSkipped} skipped (no email or phone)`,
          duration: 6000,
        });
      }
    } catch (err) {
      clearInterval(stepInterval);

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";

      setError(message);
      setStep("preview");

      // ❌ Import failed — sticky, user must dismiss
      toast.error("Import failed", {
        description: message,
        duration: Infinity,
      });
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setError(null);
    setProgress({ message: "", current: 0, total: 1 });

    // ℹ️ Reset
    toast.info("Ready for next import", {
      description: "Upload another CSV to continue",
      duration: 2500,
    });
  }, []);

  const processingProgress =
    progress.total > 0
      ? Math.min((progress.current / progress.total) * 100, 95)
      : 0;

  const processingStepItems = PROCESSING_STEPS.slice(0, -1).map(
    (label, i) => ({
      label,
      done: i < progress.current,
      active: i === progress.current,
    })
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground">GrowEasy</span>
              <span className="text-muted-foreground font-normal ml-1 text-sm">
                CSV Importer
              </span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            {(
              [
                { key: "upload", label: "Upload" },
                { key: "preview", label: "Preview" },
                { key: "processing", label: "Processing" },
                { key: "results", label: "Results" },
              ] as { key: AppStep; label: string }[]
            ).map((s, i, arr) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    step === s.key
                      ? "bg-primary text-primary-foreground"
                      : ["results"].includes(step) ||
                          (step === "processing" && s.key !== "results") ||
                          (step === "preview" && s.key === "upload")
                        ? "text-muted-foreground"
                        : "text-muted-foreground"
                  )}
                >
                  {step !== s.key &&
                  (
                    (s.key === "upload" &&
                      ["preview", "processing", "results"].includes(step)) ||
                    (s.key === "preview" &&
                      ["processing", "results"].includes(step)) ||
                    (s.key === "processing" && step === "results")
                  ) ? (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  {s.label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Dark mode toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Inline error banner (kept alongside toasts for accessibility) */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Import Error</p>
              <p className="text-sm mt-0.5 text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground">
                Import Leads via CSV
              </h1>
              <p className="text-muted-foreground mt-2">
                Upload any CSV format — Facebook leads, Google Ads exports,
                CRM dumps, spreadsheets. Our AI handles the mapping.
              </p>
            </div>

            {isParsingPreview ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Parsing CSV...</p>
              </div>
            ) : (
              <DropZone onFileSelected={handleFileSelected} />
            )}

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Facebook Leads",
                "Google Ads Export",
                "Real Estate CRM",
                "Custom Spreadsheets",
              ].map((src) => (
                <div
                  key={src}
                  className="flex items-center justify-center px-3 py-2 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center"
                >
                  {src}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && previewData && file && (
          <div className="space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Preview CSV
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  {previewData.totalRows} rows · {previewData.headers.length}{" "}
                  columns — review before importing
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRemoveFile}>
                  Change File
                </Button>
                <Button onClick={handleConfirmImport} className="gap-2">
                  Confirm Import
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <SelectedFileCard file={file} onRemove={handleRemoveFile} />

            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">
                Data Preview
                {previewData.totalRows > 100 && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (showing first 100 rows)
                  </span>
                )}
              </h3>
              <PreviewTable
                headers={previewData.headers}
                rows={previewData.rows}
                maxPreviewRows={100}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleConfirmImport}
                size="lg"
                className="gap-2"
              >
                Confirm Import
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === "processing" && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Processing Your CSV
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                AI is extracting and mapping CRM fields...
              </p>
            </div>
            <ProcessingView
              message={progress.message}
              progress={processingProgress}
              steps={processingStepItems}
            />
          </div>
        )}

        {/* Step: Results */}
        {step === "results" && importResult && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Import Results
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                AI successfully extracted CRM fields from your CSV
              </p>
            </div>
            <ResultsView result={importResult} onReset={handleReset} />
          </div>
        )}
      </main>
    </div>
  );
}
