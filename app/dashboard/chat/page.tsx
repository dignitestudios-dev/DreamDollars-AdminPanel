"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ChatRoom,
  ChatMessage,
  getAdminChatRooms,
  getChatMessages,
  sendChatMessage,
  clearChatRoom,
} from "@/lib/api/chat.api";
import { getChatSocket } from "@/lib/chat/socket";
import { useChatNotifications } from "@/context/chat-notification-context";
import {
  savePendingMessage,
  removePendingMessage,
  getPendingMessages,
  processPendingQueue,
  retrySinglePendingMessage,
  OfflineMessageSentDetail,
  OfflineMessageFailedDetail,
} from "@/lib/chat/offline-queue";
import { ChatSidebar } from "./components/chat-sidebar";
import { ChatWindow } from "./components/chat-window";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 20000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          "Loading chat history timed out. Please try again."
        )
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function SupportChatContent() {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { setActiveRoomId, markRoomAsRead } = useChatNotifications();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");

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
  const [messageLoadError, setMessageLoadError] = useState<string | null>(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // Socket state
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Responsive state for mobile view
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  // Keep refs to avoid stale closures in socket callbacks and effects
  const messagesRef = useRef<ChatMessage[]>(messages);
  const activeRetryingIdsRef = useRef<Set<string>>(new Set());
  const isRetryingRef = useRef(false);

  const activeRoomIdRef = useRef<string | null>(roomIdParam || null);
  const selectedRoomRef = useRef<ChatRoom | null>(selectedRoom);
  const userSelectedRoomIdRef = useRef<string | null>(null);
  const currentJoinedRoomIdRef = useRef<string | null>(null);
  const prevRoomIdParamRef = useRef<string | null>(null);
  const activeLoadingRoomIdRef = useRef<string | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const processedMessageIdsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    const activeId = selectedRoom
      ? String(selectedRoom.id || (selectedRoom as any)._id || "")
      : roomIdParam || null;
    activeRoomIdRef.current = activeId;
    setActiveRoomId(activeId);
    return () => {
      setActiveRoomId(null);
      activeRoomIdRef.current = null;
    };
  }, [selectedRoom, roomIdParam, setActiveRoomId]);

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
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to load chats";
        toast.error(errorMsg);
      } finally {
        setIsLoadingRooms(false);
        setIsLoadingMoreRooms(false);
      }
    },
    []
  );

  const fetchRoomsRef = useRef(fetchRooms);
  useEffect(() => {
    fetchRoomsRef.current = fetchRooms;
  }, [fetchRooms]);

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
      const targetRoomId = String(roomId);
      activeLoadingRoomIdRef.current = targetRoomId;
      try {
        if (page === 1) {
          setIsLoadingMessages(true);
          setMessageLoadError(null);
        } else {
          setIsLoadingOlder(true);
        }

        // Add timeout to the API call to prevent hanging
        const res = await withTimeout(
          getChatMessages(targetRoomId, { page, limit: 30 }),
          20000 // 20 second timeout
        );

        // Discard stale responses if user switched rooms
        if (activeRoomIdRef.current !== targetRoomId) {
          return;
        }

        const fetchedMessages = res.messages || [];

        if (res.room) {
          const roomData = res.room as {
            user_name?: string;
            user_email?: string;
            user_status?: string;
          };
          setSelectedRoom((prev) =>
            prev && String(prev.id || (prev as any)._id || "") === targetRoomId
              ? {
                ...prev,
                ...res.room,
                id: targetRoomId,
                admin_unread_count: 0,
                user_name: roomData.user_name || prev.user_name,
                user_email: roomData.user_email || prev.user_email,
                user_status: (
                  roomData.user_status ||
                  prev.user_status ||
                  "active"
                )
                  .toString()
                  .toLowerCase(),
              }
              : prev
          );
        }

        setMessages((prev) => {
          if (activeRoomIdRef.current !== targetRoomId) return prev;

          let combined: ChatMessage[];
          if (page === 1) {
            combined = [...fetchedMessages];
            // Include locally pending / unsent messages for this room
            const pendingForRoom = getPendingMessages(targetRoomId);
            if (pendingForRoom.length > 0) {
              const existingIds = new Set(
                combined.map((m) => String(m.tempId || m.id || ""))
              );
              pendingForRoom.forEach((p) => {
                if (!existingIds.has(p.tempId)) {
                  combined.push({
                    id: p.tempId,
                    tempId: p.tempId,
                    room_id: targetRoomId,
                    sender_id: String(currentUser?.id || "admin"),
                    sender_type: "admin",
                    type: "text",
                    text: p.text,
                    created_at: p.createdAt,
                    hasError: true,
                    isOptimistic: false,
                  });
                }
              });
            }
          } else {
            // Prepend older messages while avoiding duplicate ids
            const existingIds = new Set(prev.map((m) => String(m.id || (m as any)._id || "")));
            const newItems = fetchedMessages.filter(
              (m) => !existingIds.has(String(m.id || (m as any)._id || ""))
            );
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

        // Update room's unread count to 0 in local state and globally
        markRoomAsRead(targetRoomId);
        setRooms((prev) =>
          prev.map((r) =>
            String(r.id || (r as any)._id || "") === targetRoomId
              ? { ...r, admin_unread_count: 0 }
              : r
          )
        );
      }
      catch (err: unknown) {
        if (activeRoomIdRef.current !== targetRoomId) return;

        const errorMsg =
          err instanceof Error
            ? err.message
            : "Failed to load messages. Please try again.";

        if (page === 1) {
          setMessageLoadError(errorMsg);
        } else {
          toast.error(errorMsg);
        }
      } finally {
        if (activeRoomIdRef.current === targetRoomId) {
          setIsLoadingMessages(false);
          setIsLoadingOlder(false);
        }
      }
    },
    [markRoomAsRead]
  );
  const handleRetryLoadMessages = useCallback(() => {
    const roomId = selectedRoomRef.current?.id;

    if (!roomId) return;

    loadRoomMessages(String(roomId), 1);
  }, [loadRoomMessages]);
  // Handle switching rooms
  const handleSelectRoom = useCallback(
    (room: ChatRoom) => {
      const targetRoomId = String(room.id || (room as any)._id || (room as any).roomId || "");
      if (!targetRoomId) return;

      const currentActiveId = selectedRoomRef.current
        ? String(selectedRoomRef.current.id || (selectedRoomRef.current as any)._id || "")
        : null;

      if (currentActiveId === targetRoomId) {
        setMobileView("chat");
        return;
      }

      const normalizedRoom: ChatRoom = {
        ...room,
        id: targetRoomId,
        user_status: (
          room.user_status ||
          (room as any).userStatus ||
          "active"
        )
          .toString()
          .toLowerCase(),
      };

      // 1. Mark selection in refs so stale/lagging URL params from transitions cannot revert it
      userSelectedRoomIdRef.current = targetRoomId;
      activeRoomIdRef.current = targetRoomId;
      selectedRoomRef.current = normalizedRoom;
      prevRoomIdParamRef.current = targetRoomId;
      setActiveRoomId(targetRoomId);

      // 2. Immediately mark as read locally and in global unread badge
      markRoomAsRead(targetRoomId);
      setRooms((prev) =>
        prev.map((r) =>
          String(r.id || (r as any)._id || "") === targetRoomId
            ? { ...r, admin_unread_count: 0 }
            : r
        )
      );

      // 3. Update URL with Next.js router
      const nextParams = new URLSearchParams(searchParams ? searchParams.toString() : "");
      if (nextParams.get("roomId") !== targetRoomId) {
        nextParams.set("roomId", targetRoomId);
        router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
      }

      // 4. Socket room switching and read acknowledgement
      const socket = getChatSocket();
      if (socket) {
        const prevJoinedRoom = currentJoinedRoomIdRef.current;
        if (prevJoinedRoom && prevJoinedRoom !== targetRoomId) {
          socket.emit("leave_room", { roomId: prevJoinedRoom });
        }
        socket.emit("join_room", { roomId: targetRoomId }, (ack: unknown) => {
          console.log("[ChatSocket] join_room ack:", ack);
        });
        socket.emit("mark_read", { roomId: targetRoomId, room_id: targetRoomId });
        socket.emit("mark_as_read", { roomId: targetRoomId, room_id: targetRoomId });
        currentJoinedRoomIdRef.current = targetRoomId;
      }

      setSelectedRoom(normalizedRoom);
      setMessages([]);
      setMobileView("chat");
      loadRoomMessages(targetRoomId, 1);
    },
    [router, pathname, searchParams, setActiveRoomId, markRoomAsRead, loadRoomMessages]
  );

  // Auto-select room from URL query parameter (e.g. initial load, browser back/forward, or notification toast)
  useEffect(() => {
    if (!roomIdParam) return;

    const currentActiveId = selectedRoomRef.current
      ? String(selectedRoomRef.current.id || (selectedRoomRef.current as any)._id || "")
      : null;

    // When URL matches the currently open room, clear the explicit user selection guard
    if (currentActiveId === roomIdParam) {
      userSelectedRoomIdRef.current = null;
      prevRoomIdParamRef.current = roomIdParam;
      return;
    }

    // If the user explicitly chose a room, ignore stale/lagging URL params from transition
    if (userSelectedRoomIdRef.current && userSelectedRoomIdRef.current !== roomIdParam) {
      return;
    }

    if (prevRoomIdParamRef.current === roomIdParam) return;
    prevRoomIdParamRef.current = roomIdParam;

    const matched = rooms.find((r) => String(r.id || (r as any)._id || "") === roomIdParam);
    if (matched) {
      handleSelectRoom(matched);
    } else if (!isLoadingRooms) {
      const placeholderRoom: ChatRoom = {
        id: roomIdParam,
        user_id: "",
        user_name: "Customer",
        user_email: "",
        user_avatar: null,
        user_avatar_emoji: null,
        user_status: "active",
        last_message_text: null,
        last_message_sender_type: null,
        last_message_sent_at: null,
        user_unread_count: 0,
        admin_unread_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      handleSelectRoom(placeholderRoom);
    }
  }, [roomIdParam, rooms, isLoadingRooms, handleSelectRoom]);

  // Load older messages for currently active room
  const handleLoadOlderMessages = useCallback(async () => {
    const currentActiveId = selectedRoomRef.current
      ? String(selectedRoomRef.current.id || (selectedRoomRef.current as any)._id || "")
      : null;
    if (!currentActiveId || isLoadingOlder || !hasOlderMessages) return;
    await loadRoomMessages(currentActiveId, messagesPage + 1);
  }, [isLoadingOlder, hasOlderMessages, loadRoomMessages, messagesPage]);

  // Retry single failed or pending message
  const handleRetryMessage = useCallback(async (tempIdOrId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.tempId === tempIdOrId || m.id === tempIdOrId
          ? { ...m, isOptimistic: true, hasError: false }
          : m
      )
    );

    try {
      const serverMessage = await retrySinglePendingMessage(tempIdOrId);
      if (serverMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m.tempId === tempIdOrId || m.id === tempIdOrId
              ? serverMessage
              : m
          )
        );
        toast.success("Message sent successfully!");
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempIdOrId || m.id === tempIdOrId
            ? { ...m, hasError: true, isOptimistic: false }
            : m
        )
      );
      toast.error(err?.message || "Failed to retry message. Will auto-retry once online.");
    }
  }, []);

  // Auto-retry all pending/failed messages when connection is restored
  const retryAllPendingMessages = useCallback(() => {
    processPendingQueue().catch(() => {});
  }, []);

  // Synchronize optimistic messages and rooms list with global offline queue events
  useEffect(() => {
    const handleRetrying = (e: Event) => {
      const { tempId } = (e as CustomEvent<{ tempId: string; roomId: string }>).detail;
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId || m.id === tempId
            ? { ...m, isOptimistic: true, hasError: false }
            : m
        )
      );
    };

    const handleSent = (e: Event) => {
      const { tempId, serverMessage, roomId, text } = (e as CustomEvent<OfflineMessageSentDetail>).detail;

      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId || m.id === tempId ? serverMessage : m
        )
      );

      setRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => String(r.id || (r as any)._id) === String(roomId)
        );
        if (roomIndex !== -1) {
          const updated = {
            ...prev[roomIndex],
            last_message_text: text || serverMessage.text || "Message sent",
            last_message_sender_type: "admin" as const,
            last_message_sent_at: serverMessage.created_at || new Date().toISOString(),
          };
          const rest = prev.filter((_, idx) => idx !== roomIndex);
          return [updated, ...rest];
        }
        return prev;
      });
    };

    const handleFailed = (e: Event) => {
      const { tempId, error, fatal } = (e as CustomEvent<OfflineMessageFailedDetail>).detail;
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId || m.id === tempId
            ? { ...m, hasError: true, isOptimistic: false }
            : m
        )
      );
      if (fatal) {
        toast.error(`Message delivery failed: ${error}`);
      }
    };

    window.addEventListener("chat:offline_message_retrying", handleRetrying);
    window.addEventListener("chat:offline_message_sent", handleSent);
    window.addEventListener("chat:offline_message_failed", handleFailed);

    return () => {
      window.removeEventListener("chat:offline_message_retrying", handleRetrying);
      window.removeEventListener("chat:offline_message_sent", handleSent);
      window.removeEventListener("chat:offline_message_failed", handleFailed);
    };
  }, []);

  // Listen for online event and auto-send pending messages
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      console.log("[Chat] Online event triggered. Auto-sending pending messages...");
      processPendingQueue().catch(() => {});
    };

    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      processPendingQueue().catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
      retryAllPendingMessages();
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    // Inbound new_message event
    const handleNewMessage = (newMsg: ChatMessage) => {
      console.log("[ChatSocket] Incoming new_message:", newMsg);

      // Remove from offline queue if confirmed
      if (newMsg.tempId) {
        removePendingMessage(newMsg.tempId);
      }

      // Deduplicate incoming messages to prevent duplicate state updates/counters from duplicate socket emissions
      const rawId = newMsg.id || (newMsg as any)._id || (newMsg as any).messageId || (newMsg as any).message_id;
      const incomingRoomId = String(newMsg.room_id || (newMsg as any).roomId || "");
      const messageKey = rawId
        ? String(rawId)
        : `${incomingRoomId}_${newMsg.sender_id || (newMsg as any).senderId || ""}_${newMsg.created_at || (newMsg as any).createdAt || ""}_${newMsg.text || ""}`;

      const now = Date.now();
      for (const [key, timestamp] of processedMessageIdsRef.current.entries()) {
        if (now - timestamp > 60000) {
          processedMessageIdsRef.current.delete(key);
        }
      }

      if (processedMessageIdsRef.current.has(messageKey)) {
        console.log("[ChatSocket] Ignored duplicate new_message event:", messageKey);
        return;
      }
      processedMessageIdsRef.current.set(messageKey, now);

      const activeId = String(activeRoomIdRef.current || "");
      const isFromActiveRoom = Boolean(activeId) && Boolean(incomingRoomId) && activeId === incomingRoomId;

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
          // Avoid duplicate by id or _id
          const incomingMsgId = String(rawId || "");
          if (incomingMsgId && prev.some((m) => String(m.id || (m as any)._id || "") === incomingMsgId)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // NOTIFICATION SUPPRESSION:
        // When admin is viewing the active conversation on /dashboard/chat,
        // do not show toast, desktop notification, or notification sound.
      }

      // 2. Update Sidebar Rooms List & live reordering
      setRooms((prev) => {
        const roomIndex = prev.findIndex((r) => String(r.id || (r as any)._id || "") === incomingRoomId);
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
          fetchRoomsRef.current(1, searchQueryRef.current);
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
      const activeId = String(activeRoomIdRef.current || "");
      const deletedRoomId = String(payload.roomId || (payload as any).room_id || "");
      if (activeId === deletedRoomId) {
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

    // When the tab becomes visible again while viewing a room, mark as read and retry any unsent messages
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (navigator.onLine) {
          retryAllPendingMessages();
        }
        if (activeRoomIdRef.current) {
          const targetId = activeRoomIdRef.current;
          markRoomAsRead(targetId);
          getChatMessages(targetId, { page: 1, limit: 1 }).catch(() => { });
          setRooms((prev) =>
            prev.map((r) =>
              String(r.id || (r as any)._id || "") === targetId
                ? { ...r, admin_unread_count: 0 }
                : r
            )
          );
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted", handleMessageDeleted);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (currentJoinedRoomIdRef.current) {
        socket.emit("leave_room", { roomId: currentJoinedRoomIdRef.current });
        currentJoinedRoomIdRef.current = null;
      }
    };
  }, [markRoomAsRead, retryAllPendingMessages]);

  // Send Message with Optimistic UI Update (text-only)
  const handleSendMessage = async (text: string) => {
    if (!selectedRoom?.id) return;

    const userStatus = (
      selectedRoom.user_status ||
      (selectedRoom as any).userStatus ||
      "active"
    )
      .toString()
      .toLowerCase();

    if (userStatus === "deleted" || userStatus === "inactive") {
      toast.error(`Cannot send message. User account is ${userStatus}.`);
      return;
    }

    const roomId = selectedRoom.id;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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
      hasError: false,
    };

    // Save pending message to persistent storage for offline recovery
    savePendingMessage({
      tempId,
      roomId,
      text,
      createdAt: optimisticMessage.created_at,
    });

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

    // If currently offline, mark as pending error immediately without hanging
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, hasError: true, isOptimistic: false }
            : m
        )
      );
      toast.info("Offline: Message queued. It will automatically send as soon as you're online.");
      return;
    }

    try {
      const serverMessage = await retrySinglePendingMessage(tempId);
      if (serverMessage) {
        setMessages((prev) =>
          prev.map((m) => (m.tempId === tempId ? serverMessage : m))
        );
      }
    } catch (err: unknown) {
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.tempId === tempId
            ? { ...m, hasError: true, isOptimistic: false }
            : m
        )
      );
      toast.error("Failed to send message. Will auto-retry once connection is restored.");
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
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to clear chat";
      toast.error(errorMsg);
    }
  };

  // Delete Specific Message (Both Sides via Socket.IO only)
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedRoom?.id) return;
    try {
      const socket = getChatSocket();
      if (socket) {
        socket.emit("delete_message", { messageId }, (ack: unknown) => {
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
          className={`w-full md:w-72 lg:w-80 shrink-0 h-full ${mobileView === "chat" ? "hidden md:flex" : "flex"
            }`}
        >
          <ChatSidebar
            rooms={rooms}
            selectedRoomId={selectedRoom ? String(selectedRoom.id || (selectedRoom as any)._id || "") : null}
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
          className={`flex-1 h-full min-w-0 ${mobileView === "sidebar" ? "hidden md:flex" : "flex"
            }`}
        >
          <ChatWindow
            room={selectedRoom}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onDeleteMessage={handleDeleteMessage}
            onRetryMessage={handleRetryMessage}
            onLoadOlderMessages={handleLoadOlderMessages}
            hasOlderMessages={hasOlderMessages}
            isLoadingOlder={isLoadingOlder}
            onBackToSidebar={() => setMobileView("sidebar")}
            isSocketConnected={isSocketConnected}
            messageLoadError={messageLoadError}
            onRetryLoadMessages={handleRetryLoadMessages}
          />
        </div>
      </div>
    </div>
  );
}

export default function SupportChatPage() {
  return (
    <React.Suspense fallback={null}>
      <SupportChatContent />
    </React.Suspense>
  );
}
