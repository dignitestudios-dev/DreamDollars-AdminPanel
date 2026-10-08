"use client";

import React, { useState, useEffect } from "react";
import { ChatRoom } from "@/lib/api/chat.api";
import { formatConversationTime } from "@/lib/chat/chat-utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MessageSquare,
  X,
  Loader2,
  CheckCheck,
  Inbox,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ChatSidebar({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onSearch,
  isLoading,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ChatSidebarProps) {
  const [searchInput, setSearchInput] = useState("");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // 300ms Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchInput);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, onSearch]);

  const filteredRooms = filterUnreadOnly
    ? rooms.filter((r) => r.admin_unread_count > 0)
    : rooms;

  const totalUnreadCount = rooms.reduce(
    (sum, r) => sum + (r.admin_unread_count || 0),
    0
  );

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="flex h-full w-full flex-col bg-card border-r">
      {/* Header & Search */}
      <div className="p-2.5 sm:p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
              Conversations
              {totalUnreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="rounded-full px-1.5 py-0 text-[10px] font-semibold animate-pulse"
                >
                  {totalUnreadCount}
                </Badge>
              )}
            </h2>
          </div>

          <Button
            variant={filterUnreadOnly ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
            className="h-6 text-[11px] gap-1 px-2"
          >
            <Filter className="w-2.5 h-2.5" />
            {filterUnreadOnly ? "All" : "Unread"}
          </Button>
        </div>

        {/* Search input with 300ms debounce */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search users or email..."
            className="pl-8 pr-7 h-8 text-xs rounded-md bg-background"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {isLoading ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium">No conversations found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filterUnreadOnly
                  ? "No unread messages at the moment."
                  : searchInput
                  ? "No results matching your search."
                  : "User support chats will appear here."}
              </p>
            </div>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = selectedRoomId === room.id;
            const hasUnread = room.admin_unread_count > 0;
            const isLastSentByAdmin = room.last_message_sender_type === "admin";

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "flex items-start gap-2.5 p-2.5 sm:px-3 sm:py-2.5 cursor-pointer transition-colors select-none text-left relative",
                  isSelected
                    ? "bg-primary/10 border-l-3 border-l-primary"
                    : "hover:bg-accent/40"
                )}
              >
                {/* User Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-8.5 w-8.5 sm:h-9 sm:w-9 border border-border">
                    {room.user_avatar ? (
                      <AvatarImage
                        src={room.user_avatar}
                        alt={room.user_name || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[11px]">
                      {room.user_avatar_emoji || getInitials(room.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={cn(
                        "text-[12px] truncate",
                        hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"
                      )}
                    >
                      {room.user_name || "Unknown User"}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatConversationTime(room.last_message_sent_at)}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-muted-foreground truncate mb-0.5">
                    {room.user_email}
                  </p>

                  <div className="flex items-center justify-between gap-1.5">
                    <p
                      className={cn(
                        "text-[11px] truncate leading-tight max-w-[160px]",
                        hasUnread
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {isLastSentByAdmin && (
                        <span className="text-primary font-medium mr-1">You:</span>
                      )}
                      {room.last_message_text || "No messages yet"}
                    </p>

                    {hasUnread && (
                      <Badge className="h-4 min-w-4 rounded-full px-1 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {room.admin_unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load more button if paginated */}
        {hasMore && !isLoading && (
          <div className="p-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full text-xs h-8"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Loading more...
                </>
              ) : (
                "Load more conversations"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
