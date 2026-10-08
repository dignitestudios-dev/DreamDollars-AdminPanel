"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChatRoom,
  ChatMessage,
  getAdminChatRooms,
  getChatMessages,
  sendChatMessage,
  clearChatRoom,
} from "@/lib/api/chat.api";
import { getChatSocket } from "@/lib/chat/socket";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatWindow } from "./components/chat-window";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

export default function SupportChatPage() {
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Rooms state
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomsPage, setRoomsPage] = useState(1);
  const [hasMoreRooms, setHasMoreRooms] = useState(false);
  const [isLoadingMoreRooms, setIsLoadingMoreRooms] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // Socket state
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Responsive state for mobile view
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  // Keep a ref to the currently active room ID to avoid stale closures in socket callbacks
  const activeRoomIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeRoomIdRef.current = selectedRoom?.id || null;
  }, [selectedRoom?.id]);

  // Audio notification chime
  const playNotificationSound = useCallback(() => {
    try {
      // Gentle notification tone using Web Audio API (zero audio file dependencies)
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore if autoplay policy blocked audio
    }
  }, []);

  // Fetch Rooms (Sidebar List)
  const fetchRooms = useCallback(
    async (page = 1, search = "") => {
      try {
        if (page === 1) setIsLoadingRooms(true);
        else setIsLoadingMoreRooms(true);

        const res = await getAdminChatRooms({ page, limit: 20, search });
        if (res.rooms) {
          if (page === 1) {
            setRooms(res.rooms);
          } else {
            setRooms((prev) => [...prev, ...res.rooms]);
          }
          setRoomsPage(page);
          setHasMoreRooms(
            Boolean(
              res.pagination
                ? res.pagination.currentPage < res.pagination.totalPages
                : res.rooms.length >= 20
            )
          );
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load chats");
      } finally {
        setIsLoadingRooms(false);
        setIsLoadingMoreRooms(false);
      }
    },
    []
  );

  // Initial rooms load & search handler
  useEffect(() => {
    fetchRooms(1, searchQuery);
  }, [fetchRooms, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleLoadMoreRooms = useCallback(() => {
    if (!isLoadingMoreRooms && hasMoreRooms) {
      fetchRooms(roomsPage + 1, searchQuery);
    }
  }, [fetchRooms, roomsPage, hasMoreRooms, isLoadingMoreRooms, searchQuery]);

  // Fetch messages for a selected room
  const loadRoomMessages = useCallback(
    async (roomId: string, page = 1) => {
      try {
        if (page === 1) setIsLoadingMessages(true);
        else setIsLoadingOlder(true);

        const res = await getChatMessages(roomId, { page, limit: 30 });
        const fetchedMessages = res.messages || [];

        setMessages((prev) => {
          let combined: ChatMessage[];
          if (page === 1) {
            combined = fetchedMessages;
          } else {
            // Prepend older messages while avoiding duplicate ids
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = fetchedMessages.filter((m) => !existingIds.has(m.id));
            combined = [...newItems, ...prev];
          }

          // Sort chronologically ascending (oldest first, latest at bottom)
          return combined.sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        setMessagesPage(page);
        setHasOlderMessages(
          Boolean(
            res.pagination
              ? res.pagination.currentPage < res.pagination.totalPages
              : fetchedMessages.length >= 30
          )
        );

        // Update room's unread count to 0 in local state
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId ? { ...r, admin_unread_count: 0 } : r
          )
        );
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingOlder(false);
      }
    },
    []
  );

  // Handle switching rooms
  const handleSelectRoom = useCallback(
    (room: ChatRoom) => {
      if (selectedRoom?.id === room.id) {
        setMobileView("chat");
        return;
      }

      const socket = getChatSocket();
      if (socket) {
        if (selectedRoom?.id) {
          socket.emit("leave_room", { roomId: selectedRoom.id });
        }
        socket.emit("join_room", { roomId: room.id }, (ack: any) => {
          console.log("[ChatSocket] join_room ack:", ack);
        });
      }

      setSelectedRoom(room);
      setMessages([]);
      setMobileView("chat");
      loadRoomMessages(room.id, 1);
    },
    [selectedRoom, loadRoomMessages]
  );

  // Load older messages for currently active room
  const handleLoadOlderMessages = useCallback(async () => {
    if (!selectedRoom?.id || isLoadingOlder || !hasOlderMessages) return;
    await loadRoomMessages(selectedRoom.id, messagesPage + 1);
  }, [selectedRoom?.id, isLoadingOlder, hasOlderMessages, loadRoomMessages, messagesPage]);

  // Setup Socket.IO Event Handlers
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const handleConnect = () => {
      setIsSocketConnected(true);
      // Re-join active room if any
      if (activeRoomIdRef.current) {
        socket.emit("join_room", { roomId: activeRoomIdRef.current });
      }
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    // Inbound new_message event
    const handleNewMessage = (newMsg: ChatMessage) => {
      console.log("[ChatSocket] Incoming new_message:", newMsg);
      const activeId = activeRoomIdRef.current;
      const isFromActiveRoom = activeId === newMsg.room_id;

      // 1. Update Active Chat Window if currently viewing this room
      if (isFromActiveRoom) {
        setMessages((prev) => {
          // If optimistic message with same tempId exists, replace it
          if (newMsg.tempId) {
            const tempIndex = prev.findIndex((m) => m.tempId === newMsg.tempId);
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = newMsg;
              return updated;
            }
          }
          // Avoid duplicate by id
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }

      // 2. Play subtle chime & show notification if message is from user
      if (newMsg.sender_type === "user") {
        playNotificationSound();
        if (!isFromActiveRoom) {
          toast.info(`New message received`, {
            description: newMsg.text || "Sent an attachment",
          });
        }
      }

      // 3. Update Sidebar Rooms List & live reordering
      setRooms((prev) => {
        const roomIndex = prev.findIndex((r) => r.id === newMsg.room_id);
        const lastText =
          newMsg.text ||
          (newMsg.attachments?.length ? "Attachment" : "New message");

        if (roomIndex !== -1) {
          const existingRoom = prev[roomIndex];
          const updatedRoom: ChatRoom = {
            ...existingRoom,
            last_message_text: lastText,
            last_message_sender_type: newMsg.sender_type,
            last_message_sent_at: newMsg.created_at,
            admin_unread_count: isFromActiveRoom
              ? 0
              : (existingRoom.admin_unread_count || 0) + 1,
          };

          // Reorder: Move updated room to top
          const remaining = prev.filter((_, idx) => idx !== roomIndex);
          return [updatedRoom, ...remaining];
        } else {
          // If room not currently in local list, refresh rooms from server
          fetchRooms(1, searchQuery);
          return prev;
        }
      });
    };

    // Inbound message_deleted event
    const handleMessageDeleted = (payload: {
      messageId: string;
      roomId: string;
    }) => {
      console.log("[ChatSocket] Message deleted:", payload);
      const activeId = activeRoomIdRef.current;
      if (activeId === payload.roomId) {
        setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("message_deleted", handleMessageDeleted);

    if (socket.connected) {
      setIsSocketConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, [playNotificationSound, fetchRooms, searchQuery]);

  // Send Message with Optimistic UI Update (text-only)
  const handleSendMessage = async (text: string) => {
    if (!selectedRoom?.id) return;

    const roomId = selectedRoom.id;
    const tempId = `temp-${Date.now()}`;

    // Create optimistic message representation
    const optimisticMessage: ChatMessage = {
      id: tempId,
      tempId,
      room_id: roomId,
      sender_id: String(currentUser?.id || "admin"),
      sender_type: "admin",
      type: "text",
      text: text,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Immediately show bubble in active chat
    setMessages((prev) => [...prev, optimisticMessage]);

    // Live bump room to top in sidebar
    setRooms((prev) => {
      const roomIndex = prev.findIndex((r) => r.id === roomId);
      if (roomIndex !== -1) {
        const targetRoom = {
          ...prev[roomIndex],
          last_message_text: text,
          last_message_sender_type: "admin" as const,
          last_message_sent_at: optimisticMessage.created_at,
        };
        const rest = prev.filter((_, idx) => idx !== roomIndex);
        return [targetRoom, ...rest];
      }
      return prev;
    });

    try {
      const serverMessage = await sendChatMessage(roomId, {
        text,
        tempId,
      });

      if (serverMessage && (serverMessage.id || serverMessage.tempId)) {
        // Replace optimistic message with actual persisted message
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? serverMessage : m))
        );
      }
    } catch (err: any) {
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) => (m.tempId === tempId ? { ...m, hasError: true, isOptimistic: false } : m))
      );
      throw err;
    }
  };

  // Clear Chat History for Admin View
  const handleClearChat = async () => {
    if (!selectedRoom?.id) return;
    try {
      const res = await clearChatRoom(selectedRoom.id);
      if (res.success) {
        setMessages([]);
        toast.success("Chat history cleared for admin view");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to clear chat");
    }
  };

  // Delete Specific Message (Both Sides via Socket.IO only)
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedRoom?.id) return;
    try {
      const socket = getChatSocket();
      if (socket) {
        socket.emit("delete_message", { messageId }, (ack: any) => {
          console.log("[ChatSocket] delete_message ack:", ack);
        });
      }

      // Optimistically remove from active message history
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted successfully");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support Chat</h1>
          <p className="text-xs text-muted-foreground">
            Manage real-time 1-on-1 customer support conversations and queries.
          </p>
        </div>
      </div>

      {/* Main Split-Pane Container */}
      <div className="h-[calc(100vh-11rem)] min-h-[520px] w-full rounded-xl border bg-card shadow-xs overflow-hidden flex flex-row">
        {/* Left Sidebar (Conversations List) */}
        <div
          className={`w-full md:w-72 lg:w-80 shrink-0 h-full ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatSidebar
            rooms={rooms}
            selectedRoomId={selectedRoom?.id || null}
            onSelectRoom={handleSelectRoom}
            onSearch={handleSearch}
            isLoading={isLoadingRooms}
            onLoadMore={handleLoadMoreRooms}
            hasMore={hasMoreRooms}
            isLoadingMore={isLoadingMoreRooms}
          />
        </div>

        {/* Right Chat Area (Active Conversation) */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileView === "sidebar" ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatWindow
            room={selectedRoom}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onDeleteMessage={handleDeleteMessage}
            onLoadOlderMessages={handleLoadOlderMessages}
            hasOlderMessages={hasOlderMessages}
            isLoadingOlder={isLoadingOlder}
            onBackToSidebar={() => setMobileView("sidebar")}
            isSocketConnected={isSocketConnected}
          />
        </div>
      </div>
    </div>
  );
}
