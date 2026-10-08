"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ChatInputBarProps {
  onSendMessage: (text: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInputBar({ onSendMessage, disabled = false }: ChatInputBarProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input (starts at 38px, max 120px)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(
        38,
        Math.min(textareaRef.current.scrollHeight, 120)
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending || disabled) return;

    try {
      setIsSending(true);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "38px";
      }

      await onSendMessage(trimmed);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-card/80 backdrop-blur-md p-2.5 sm:p-3">
      <div className="flex items-end gap-2">
        {/* Text Area */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={
              disabled
                ? "Select a conversation to start messaging..."
                : "Type your message... (Shift + Enter for new line)"
            }
            className="block w-full resize-none rounded-lg border border-input bg-background px-3 py-[8px] text-xs sm:text-[13px] leading-[20px] ring-offset-background placeholder:text-muted-foreground placeholder:text-xs focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 min-h-[38px] max-h-[120px] box-border"
          />
        </div>

        {/* Send Button - perfectly aligned at 38px matching textarea */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={disabled || isSending || !text.trim()}
          className="h-[38px] px-3.5 shrink-0 rounded-lg gap-1.5 text-xs font-medium shadow-2xs self-end flex items-center justify-center"
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
    </div>
  );
}
