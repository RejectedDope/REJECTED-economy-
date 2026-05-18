"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { FileUploader, type UploadedFile } from "@/components/ingestion/FileUploader";
import { ReviewTable, type ReviewRow } from "@/components/ingestion/ReviewTable";
import { parseCSVFile, type CsvParseResult, type CsvRowError } from "@/lib/ingestion/csv-parser";
import { validateScreenshotFile } from "@/lib/ingestion/screenshot-parser";
import { detectDuplicates, type NormalizedRow } from "@/lib/ingestion/normalize";
import { logger } from "@/lib/logger";

type Stage = "upload" | "review" | "done";

type ImportState = {
  result: CsvParseResult | null;
  rows: ReviewRow[];
  errors: CsvRowError[];
  warnings: CsvRowError[];
  screenshotCount: number;
};

function buildReviewRows(normalizedRows: NormalizedRow[]): ReviewRow[] {
  const { duplicates } = detectDuplicates(normalizedRows);
  const dupeKeys = new Set(duplicates.map((d) => d.item));

  return normalizedRows.map((row, idx) => ({
    ...row,
    rowIndex: idx + 1,
    reviewStatus: "approved" as const,
    isDuplicate: dupeKeys.has(row),
    duplicateOfRow: duplicates.find((d) => d.item === row)?.firstSeenAt,
  }));
}

export default function ImportPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("upload");
  const [importState, setImportState] = useState<ImportState>({
    result: null,
    rows: [],
    errors: [],
    warnings: [],
    screenshotCount: 0,
  });
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFilesAccepted = useCallback((files: UploadedFile[]) => {
    setParseError(null);
    const csvFiles = files.filter((f) => f.type === "csv" || f.type === "xlsx");
    const screenshots = files.filter((f) => f.type === "screenshot");

    let screenshotWarnings = 0;
    screenshots.forEach((s) => {
      const v = validateScreenshotFile({ name: s.file.name, size: s.file.size, type: s.file.type });
      if (!v.valid) screenshotWarnings++;
    });

    if (csvFiles.length === 0 && screenshots.length > 0) {
      // Screenshots only — go to review with empty CSV + screenshot staging notice
      setImportState({
        result: null,
        rows: [],
        errors: [],
        warnings: [],
        screenshotCount: screenshots.length - screenshotWarnings,
      });
      setStage("review");
      return;
    }

    if (csvFiles.length === 0) {
      setParseError("No parseable files found. Upload a CSV, XLSX, or screenshot.");
      return;
    }

    // Process first CSV file (batch: future enhancement)
    const first = csvFiles[0];

    if (first.type === "xlsx") {
      // XLSX parsing requires server action — notify user
      setParseError(
        "XLSX files are parsed server-side. This browser preview will be available after Supabase Storage is configured. For now, export your spreadsheet as CSV and re-upload."
      );
      return;
    }

    parseCSVFile(first.file, (result) => {
      logger.info("ingestion", "CSV parsed in browser", {
        file: first.file.name,
        rows: result.totalParsed,
        ok: result.rows.length,
        errors: result.errors.length,
      });

      if (result.rows.length === 0 && result.errors.length > 0) {
        setParseError(
          `Could not parse any rows. Check that the file is a valid CSV inventory export.`
        );
        return;
      }

      const reviewRows = buildReviewRows(result.rows);

      setImportState({
        result,
        rows: reviewRows,
        errors: result.errors,
        warnings: result.warnings,
        screenshotCount: screenshots.length,
      });
      setStage("review");
    });
  }, []);

  function handleApproveAll() {
    setImportState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.isDuplicate ? r : { ...r, reviewStatus: "approved" }
      ),
    }));
  }

  function handleExcludeRow(rowIndex: number) {
    setImportState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.rowIndex === rowIndex ? { ...r, reviewStatus: "excluded" } : r
      ),
    }));
  }

  function handleRestoreRow(rowIndex: number) {
    setImportState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.rowIndex === rowIndex ? { ...r, reviewStatus: "approved" } : r
      ),
    }));
  }

  async function handleImport(approvedRows: ReviewRow[]) {
    setIsImporting(true);
    try {
      // In production this calls a Server Action that writes to Supabase.
      // For the browser-only preview, we simulate the import.
      await new Promise((r) => setTimeout(r, 400));
      setImportedCount(approvedRows.length);
      setStage("done");
      logger.info("ingestion", "Import complete (simulated)", { count: approvedRows.length });
    } catch (err) {
      logger.error("ingestion", "Import failed", { error: String(err) });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/inventory"
          className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inventory
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-100">
          Import Inventory
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload CSV exports, spreadsheets, or listing screenshots. Review before importing.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-4">
        {[
          { id: "upload", label: "Upload" },
          { id: "review", label: "Review" },
          { id: "done", label: "Done" },
        ].map((step, idx) => {
          const stages: Stage[] = ["upload", "review", "done"];
          const current = stages.indexOf(stage);
          const stepIdx = stages.indexOf(step.id as Stage);
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  stepIdx < current
                    ? "bg-emerald-500 text-white"
                    : stepIdx === current
                    ? "bg-[#E935C1] text-white"
                    : "border border-zinc-700 text-zinc-600"
                }`}
              >
                {stepIdx < current ? "✓" : idx + 1}
              </div>
              <span
                className={`text-sm font-semibold ${
                  stepIdx === current ? "text-zinc-100" : "text-zinc-600"
                }`}
              >
                {step.label}
              </span>
              {idx < 2 && <div className="h-px w-8 bg-zinc-800" />}
            </div>
          );
        })}
      </div>

      {/* Stage content */}
      {stage === "upload" && (
        <div className="space-y-4">
          <FileUploader onFilesAccepted={handleFilesAccepted} />
          {parseError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {stage === "review" && (
        <div className="space-y-4">
          {importState.screenshotCount > 0 && importState.rows.length === 0 && (
            <div className="rounded-lg border border-blue-400/30 bg-blue-400/10 px-5 py-4">
              <p className="text-sm font-semibold text-blue-300">
                {importState.screenshotCount} screenshot{importState.screenshotCount > 1 ? "s" : ""} staged for manual review
              </p>
              <p className="mt-1 text-xs text-blue-300/70">
                Screenshots are queued as pending review. Enter the listing details manually
                for each screenshot before importing.
              </p>
            </div>
          )}

          {importState.rows.length > 0 && (
            <ReviewTable
              rows={importState.rows}
              errors={importState.errors}
              warnings={importState.warnings}
              skipped={importState.result?.skipped ?? 0}
              truncated={importState.result?.truncated ?? false}
              onApproveAll={handleApproveAll}
              onExcludeRow={handleExcludeRow}
              onRestoreRow={handleRestoreRow}
              onImport={handleImport}
              importing={isImporting}
            />
          )}

          {importState.rows.length === 0 && importState.screenshotCount === 0 && (
            <div className="rounded-lg border border-zinc-800 px-6 py-12 text-center">
              <p className="text-sm text-zinc-600">No rows to review.</p>
              <button
                onClick={() => setStage("upload")}
                className="mt-3 text-sm text-[#E935C1] hover:underline"
              >
                Go back and try again
              </button>
            </div>
          )}
        </div>
      )}

      {stage === "done" && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-8 py-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <h2 className="mt-4 text-xl font-bold text-zinc-100">
            {importedCount} listing{importedCount !== 1 ? "s" : ""} imported
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Your inventory has been updated. Scores will be calculated on the next scan.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => router.push("/inventory")}
              className="rounded-lg bg-[#E935C1] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              View inventory
            </button>
            <button
              onClick={() => {
                setStage("upload");
                setImportState({ result: null, rows: [], errors: [], warnings: [], screenshotCount: 0 });
              }}
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:border-zinc-500"
            >
              Import more
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
