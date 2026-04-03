"use client";

import React, { useEffect, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import type { ExportFormat } from "@/lib/export";

export default function ExportDialog({
  description,
  isOpen,
  onClose,
  onExport,
  title,
}: {
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  title: string;
}) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] px-6 py-5">
          <div>
            <h2 className="text-[18px] font-semibold text-[hsl(var(--foreground))]">
              {title}
            </h2>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
            aria-label="Close export dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <button
            type="button"
            onClick={() => setSelectedFormat("csv")}
            className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
              selectedFormat === "csv"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]"
                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
                <Download size={16} className="text-[hsl(var(--primary))]" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[hsl(var(--foreground))]">
                  CSV file
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  Download the rows currently shown on this page.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFormat("pdf")}
            className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
              selectedFormat === "pdf"
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]"
                : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.5)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[hsl(var(--muted))] p-2">
                <FileText size={16} className="text-[hsl(var(--primary))]" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-[hsl(var(--foreground))]">
                  Print view
                </p>
                <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  Open the current rows in a print view that you can save as PDF.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--border))] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onExport(selectedFormat)}
            className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
          >
            {selectedFormat === "csv" ? "Download CSV" : "Open Print View"}
          </button>
        </div>
      </div>
    </div>
  );
}
