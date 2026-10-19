"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  ChatRoom,
  ChatMessage,
  ChatAttachment,
} from "@/lib/api/chat.api";
import { formatMessageDateHeader } from "@/lib/chat/chat-utils";
import { ChatMessageBubble } from "./chat-message-bubble";
import { ChatInputBar } from "./chat-input-bar";
import { MediaLightboxDialog } from "./media-lightbox-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Loader2,
  MessageSquareOff,
  User,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

interface ChatWindowProps {
  room: ChatRoom | null;
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  onRetryMessage?: (messageId: string) => Promise<void> | void;
  onLoadOlderMessages?: () => Promise<void>;
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  onBackToSidebar?: () => void;
  isSocketConnected?: boolean;
  messageLoadError?: string | null;
  onRetryLoadMessages?: () => void;
}

export function ChatWindow({
  room,
  messages,
  isLoadingMessages,
  onSendMessage,
  onClearChat,
  onDeleteMessage,
  onRetryMessage,
  onLoadOlderMessages,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onBackToSidebar,
  isSocketConnected = true,
  messageLoadError,
  onRetryLoadMessages,
}: ChatWindowProps) {
  const [selectedAttachment, setSelectedAttachment] =
    useState<ChatAttachment | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Group messages by date

  const groupedMessages = useMemo(() => {
    const groups = new Map<
      string,
      { dateLabel: string; items: ChatMessage[] }
    >();

    for (const msg of messages) {
      const label = formatMessageDateHeader(msg.created_at);
      let group = groups.get(label);

      if (!group) {
        group = { dateLabel: label, items: [] };
        groups.set(label, group);
      }

      group.items.push(msg);
    }

    return Array.from(groups.values());
  }, [messages]);

  // Scroll to bottom when room changes or new message sent/received (if near bottom)
  useEffect(() => {
    if (!isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isLoadingMessages, room?.id]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!room) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center p-8 text-center bg-muted/10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <User className="w-8 h-8 opacity-80" />
        </div>

        <h3 className="font-semibold text-lg mb-1">
          No Conversation Selected
        </h3>

        <p className="text-sm text-muted-foreground max-w-sm">
          Select a user conversation from the left sidebar to view their
          message history and reply in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-background">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b bg-card/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {onBackToSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBackToSidebar}
              className="md:hidden h-7.5 w-7.5 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}

          <div className="relative">
            <Avatar className="h-8.5 w-8.5 sm:h-9 sm:w-9 border">
              {room.user_avatar ? (
                <AvatarImage src={room.user_avatar} alt={room.user_name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {room.user_avatar_emoji || getInitials(room.user_name)}
              </AvatarFallback>
            </Avatar>
            {isSocketConnected && (
              <span
                className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background"
                title="Real-time connected"
              />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold leading-none">
                {room.user_name || "Unknown User"}
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
              {room.user_email}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          {room.user_id && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex h-7.5 gap-1.5 text-xs rounded-lg px-2.5"
            >
              <Link href={`/dashboard/users/${room.user_id}`}>
                <ExternalLink className="w-3.5 h-3.5" />
                View User Profile
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7.5 w-7.5 rounded-lg"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {room.user_id && (
                <DropdownMenuItem asChild className="sm:hidden text-xs">
                  <Link href={`/dashboard/users/${room.user_id}`}>
                    <ExternalLink className="w-3.5 h-3.5 mr-2" />
                    View User Profile
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem
                onClick={() => setClearDialogOpen(true)}
                className="text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Clear Chat History (Admin)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 relative bg-muted/5"
      >
        {/* Load older messages button */}
        {hasOlderMessages && (
          <div className="text-center py-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadOlderMessages}
              disabled={isLoadingOlder}
              className="text-[11px] h-6.5 rounded-full px-2.5"
            >
              {isLoadingOlder ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                  Loading older messages...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        {/* Loading Initial State */}

        {isLoadingMessages ? (
          <div
            className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-7 h-7 animate-spin text-primary" />

            <span className="text-sm font-medium">
              Loading chat history...
            </span>

            <span className="text-xs">
              Large conversations may take a little longer.
            </span>
          </div>
        ) : messageLoadError ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <MessageSquareOff className="w-8 h-8 text-muted-foreground" />

            <p className="text-sm font-medium">
              Unable to load conversation
            </p>

            <p className="text-xs text-muted-foreground max-w-sm">
              {messageLoadError}
            </p>

            <Button
              variant="outline"
              size="sm"
              onClick={onRetryLoadMessages}
              className="gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        )
          : messages.length === 0 ? (
            /* Empty Messages State */
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground text-center">
              <MessageSquareOff className="w-8 h-8 opacity-40 mb-1" />
              <p className="text-sm font-medium">No messages in this chat</p>
              <p className="text-xs max-w-xs text-muted-foreground">
                Send a message below to initiate support with {room.user_name}.
              </p>
            </div>
          ) : (
            /* Grouped Messages Timeline */
            groupedMessages.map((group) => (
              <div key={group.dateLabel} className="space-y-1.5">
                {/* Date Separator Pill */}
                <div className="flex items-center justify-center my-2">
                  <span className="rounded-full bg-muted/80 border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-2xs">
                    {group.dateLabel}
                  </span>
                </div>

                {group.items.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id || msg.tempId}
                    message={msg}
                    userName={room.user_name}
                    onDeleteMessage={(id) => setDeleteMessageId(id)}
                    onPreviewAttachment={(att) => setSelectedAttachment(att)}
                    onRetryMessage={onRetryMessage}
                  />
                ))}
              </div>
            ))
          )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <ChatInputBar onSendMessage={onSendMessage} disabled={isLoadingMessages} />

      {/* Media Lightbox */}
      <MediaLightboxDialog
        attachment={selectedAttachment}
        isOpen={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
      />

      {/* Clear Chat Alert Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear past messages from your admin view for this conversation.
              The user will still be able to see their chat history on their end.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onClearChat();
                setClearDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Clear for Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Specific Message Alert Dialog */}
      <AlertDialog
        open={Boolean(deleteMessageId)}
        onOpenChange={(open) => !open && setDeleteMessageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be deleted for both you and the user in real time.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteMessageId) {
                  await onDeleteMessage(deleteMessageId);
                  setDeleteMessageId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
