"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X } from "lucide-react";
import { ChatAttachment } from "@/lib/api/chat.api";
import { formatFileSize, getAttachmentType } from "@/lib/chat/chat-utils";

interface MediaLightboxDialogProps {
  attachment: ChatAttachment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaLightboxDialog({
  attachment,
  isOpen,
  onClose,
}: MediaLightboxDialogProps) {
  if (!attachment) return null;

  const type = getAttachmentType(attachment.mimeType, attachment.originalName);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-md border">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col truncate pr-4">
            <DialogTitle className="text-sm font-semibold truncate">
              {attachment.originalName || "Attachment Preview"}
            </DialogTitle>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(attachment.size)} • {attachment.mimeType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 gap-1.5 text-xs"
            >
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                download={attachment.originalName}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center p-4 min-h-[300px] max-h-[75vh] overflow-auto bg-black/5 dark:bg-black/40">
          {type === "image" && (
            <img
              src={attachment.url}
              alt={attachment.originalName}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-md shadow-md"
            />
          )}

          {type === "video" && (
            <video
              src={attachment.url}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-md shadow-md"
            />
          )}

          {type === "audio" && (
            <div className="p-8 w-full max-w-md bg-card rounded-xl border shadow-xs flex flex-col items-center gap-4">
              <audio src={attachment.url} controls className="w-full" />
              <p className="text-xs text-muted-foreground">
                {attachment.originalName}
              </p>
            </div>
          )}

          {(type === "pdf" || type === "document" || type === "archive" || type === "other") && (
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <ExternalLink className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-base mb-1">
                {attachment.originalName}
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                {formatFileSize(attachment.size)}
              </p>
              <Button asChild size="sm">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
