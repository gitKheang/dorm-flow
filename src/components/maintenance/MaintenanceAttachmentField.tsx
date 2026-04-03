"use client";

import React, { useId, useState } from "react";
import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import type { MaintenanceAttachment } from "@/lib/mockData";
import {
  filesToMaintenanceAttachments,
  formatAttachmentSize,
  isImageAttachment,
} from "@/lib/maintenanceAttachments";

function AttachmentPreviewCard({
  attachment,
  onRemove,
}: {
  attachment: MaintenanceAttachment;
  onRemove?: (attachmentId: string) => void;
}) {
  const imageAttachment = isImageAttachment(attachment);

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
          {imageAttachment ? (
            <img
              src={attachment.dataUrl}
              alt={attachment.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <FileText size={18} className="text-[hsl(var(--muted-foreground))]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-[hsl(var(--foreground))]">
                {attachment.name}
              </p>
              <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                {imageAttachment ? "Image attachment" : "File attachment"} ·{" "}
                {formatAttachmentSize(attachment.size)}
              </p>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-red-600"
                aria-label={`Remove ${attachment.name}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <a
              href={attachment.dataUrl}
              download={attachment.name}
              className="text-[12px] font-medium text-[hsl(var(--primary))] hover:underline"
            >
              {imageAttachment ? "Download image" : "Download file"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceAttachmentList({
  attachments,
  onRemove,
  emptyLabel = "No attachments",
}: {
  attachments: MaintenanceAttachment[];
  onRemove?: (attachmentId: string) => void;
  emptyLabel?: string;
}) {
  if (attachments.length === 0) {
    return (
      <p className="text-[12px] text-[hsl(var(--muted-foreground))]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <AttachmentPreviewCard
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default function MaintenanceAttachmentField({
  attachments,
  onChange,
  label = "Attachments",
  helperText = "Add photos or files that help explain the issue.",
}: {
  attachments: MaintenanceAttachment[];
  onChange: (attachments: MaintenanceAttachment[]) => void;
  label?: string;
  helperText?: string;
}) {
  const inputId = useId();
  const [isReadingFiles, setIsReadingFiles] = useState(false);

  async function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const nextFiles = event.target.files;
    if (!nextFiles || nextFiles.length === 0) {
      return;
    }

    try {
      setIsReadingFiles(true);
      const nextAttachments = await filesToMaintenanceAttachments(nextFiles);
      onChange([...attachments, ...nextAttachments]);
    } finally {
      setIsReadingFiles(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-[hsl(var(--foreground))]"
          >
            {label}
          </label>
          <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
            {helperText}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <ImageIcon size={16} className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                Upload images or supporting files
              </p>
              <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                JPG, PNG, PDF, and other common file types are supported.
              </p>
            </div>
          </div>
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            <Paperclip size={15} />
            {isReadingFiles ? "Preparing..." : "Add files"}
          </label>
        </div>
        <input
          id={inputId}
          type="file"
          multiple
          onChange={handleFileSelection}
          className="sr-only"
        />
      </div>

      <MaintenanceAttachmentList
        attachments={attachments}
        onRemove={(attachmentId) =>
          onChange(
            attachments.filter((attachment) => attachment.id !== attachmentId),
          )
        }
        emptyLabel="No files attached yet."
      />
    </div>
  );
}
