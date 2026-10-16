"use client";

import React from "react";
import { ChatMessage, ChatAttachment } from "@/lib/api/chat.api";
import {
  formatMessageTime,
  formatFileSize,
  getAttachmentType,
} from "@/lib/chat/chat-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileArchive,
  Download,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  File,
  Eye,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

function renderMessageContent(text: string, isAdmin: boolean) {
  if (!text) return null;

  const parts = text.split(URL_REGEX);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (!part) return null;

    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "underline underline-offset-2 break-all transition-opacity cursor-pointer",
            isAdmin
              ? "text-primary-foreground font-medium hover:opacity-85"
              : "text-primary font-medium hover:opacity-85"
          )}
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  userName?: string;
  onDeleteMessage?: (messageId: string) => void;
  onPreviewAttachment?: (attachment: ChatAttachment) => void;
  onRetryMessage?: (messageId: string) => void;
}

export function ChatMessageBubble({
  message,
  userName = "User",
  onDeleteMessage,
  onPreviewAttachment,
  onRetryMessage,
}: ChatMessageBubbleProps) {
  const isAdmin = message.sender_type === "admin";
  const [copied, setCopied] = React.useState(false);

  const handleCopyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      toast.success("Text copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div
      className={cn(
        "group flex w-full items-end gap-1.5 my-1 transition-all",
        isAdmin ? "justify-end" : "justify-start"
      )}
    >
      {/* Bubble Container */}
      <div
        className={cn(
          "relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-[60px] flex flex-col rounded-xl shadow-2xs transition-shadow overflow-hidden [overflow-wrap:anywhere]",
          isAdmin
            ? "bg-primary text-primary-foreground rounded-br-xs px-3 py-1.5"
            : "bg-muted/90 text-foreground border border-border/40 rounded-bl-xs px-2.5 py-1 sm:px-2.5 sm:py-1.2"
        )}
      >
        {/* Actions Dropdown on Hover */}
        <div
          className={cn(
            "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
            isAdmin ? "-left-7" : "-right-7"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full bg-background/80 shadow-xs hover:bg-background border text-foreground"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAdmin ? "end" : "start"} className="w-36">
              {message.hasError && onRetryMessage && (
                <DropdownMenuItem
                  onClick={() => onRetryMessage(message.tempId || message.id)}
                  className="gap-2 text-xs font-medium text-emerald-600 focus:text-emerald-700 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry send
                </DropdownMenuItem>
              )}
              {message.text && (
                <DropdownMenuItem onClick={handleCopyText} className="gap-2 text-xs">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  Copy text
                </DropdownMenuItem>
              )}
              {onDeleteMessage && (
                <DropdownMenuItem
                  onClick={() => onDeleteMessage(message.id)}
                  className="gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sender Label for user messages (in case needed) */}
        {!isAdmin && (
          <span className="text-[11px] font-semibold text-primary/80 mb-1">
            {userName}
          </span>
        )}

        {/* Attachments Rendering */}
        {hasAttachments && (
          <div className="flex flex-col gap-2 mb-2">
            {message.attachments!.map((att, idx) => {
              const attType = getAttachmentType(att.mimeType, att.originalName);

              if (attType === "image") {
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl bg-black/10 cursor-pointer group/img max-w-sm"
                    onClick={() => onPreviewAttachment?.(att)}
                  >
                    <img
                      src={att.url}
                      alt={att.originalName || "Attached image"}
                      className="w-full max-h-72 object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-102"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-white/90 text-black hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewAttachment?.(att);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </Button>
                    </div>
                  </div>
                );
              }

              if (attType === "video") {
                return (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl bg-black/20 max-w-sm"
                  >
                    <video
                      src={att.url}
                      controls
                      className="w-full max-h-72 rounded-xl object-contain"
                      preload="metadata"
                    />
                  </div>
                );
              }

              if (attType === "audio") {
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col p-2 rounded-xl border max-w-xs",
                      isAdmin
                        ? "bg-primary-foreground/10 border-white/20"
                        : "bg-background border-border"
                    )}
                  >
                    <span className="text-xs truncate font-medium mb-1">
                      {att.originalName || "Audio clip"}
                    </span>
                    <audio src={att.url} controls className="w-full h-8" />
                  </div>
                );
              }

              // Document / PDF / Archive / Generic File
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border max-w-xs transition-colors",
                    isAdmin
                      ? "bg-primary-foreground/15 border-white/20 text-primary-foreground hover:bg-primary-foreground/25"
                      : "bg-background border-border text-foreground hover:bg-accent/40"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg flex items-center justify-center shrink-0",
                      isAdmin
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {attType === "pdf" ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : attType === "archive" ? (
                      <FileArchive className="w-5 h-5" />
                    ) : (
                      <File className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" title={att.originalName}>
                      {att.originalName}
                    </p>
                    <p
                      className={cn(
                        "text-[10px]",
                        isAdmin ? "text-primary-foreground/75" : "text-muted-foreground"
                      )}
                    >
                      {formatFileSize(att.size)}
                    </p>
                  </div>

                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={att.originalName}
                    className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      isAdmin
                        ? "hover:bg-white/20 text-white"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Text */}
        {message.text && (
          <p
            className={cn(
              "whitespace-pre-wrap break-words [word-break:break-word] [overflow-wrap:anywhere] leading-snug select-text font-normal",
              isAdmin
                ? "text-xs sm:text-[13px]"
                : "text-[11.5px] sm:text-xs text-foreground/90"
            )}
          >
            {renderMessageContent(message.text, isAdmin)}
          </p>
        )}

        {/* Footer: Time & Status Indicator */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-0.5 text-[9.5px]",
            isAdmin ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          <span>{formatMessageTime(message.created_at)}</span>

          {isAdmin && (
            <>
              {message.isOptimistic ? (
                <span title="Sending...">
                  <Loader2 className="w-2.5 h-2.5 animate-spin opacity-80" />
                </span>
              ) : message.hasError ? (
                <button
                  type="button"
                  title="Failed to send. Click to retry now"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRetryMessage && (message.tempId || message.id)) {
                      onRetryMessage(message.tempId || message.id);
                    }
                  }}
                  className="inline-flex items-center gap-1 hover:opacity-100 transition-opacity cursor-pointer group/retry ml-1"
                >
                  <span className="text-[9.5px] text-red-200 underline group-hover/retry:text-white font-medium">
                    Retry
                  </span>
                  <AlertCircle className="w-2.5 h-2.5 text-red-300 group-hover/retry:text-white" />
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
