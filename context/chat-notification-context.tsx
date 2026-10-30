"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { RootState } from "@/lib/store";
import { ChatRoom, ChatMessage, getAdminChatRooms, getChatMessages } from "@/lib/api/chat.api";
import { getChatSocket } from "@/lib/chat/socket";
import { playNotificationSound, unlockAudioContext } from "@/lib/chat/chat-sound";
import { requestFcmToken, onForegroundMessage } from "@/lib/firebase/messaging";
import {
  setupGlobalOfflineRetryListener,
  processPendingQueue,
  removePendingMessage,
  OfflineMessageSentDetail,
} from "@/lib/chat/offline-queue";
import { toast } from "sonner";
import { Socket } from "socket.io-client";

interface ChatNotificationContextType {
  socket: Socket | null;
  isSocketConnected: boolean;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;
  totalUnreadCount: number;
  setTotalUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  rooms: ChatRoom[];
  refreshRooms: () => Promise<void>;
  markRoomAsRead: (roomId: string) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(
  undefined
);

export function ChatNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const pathname = usePathname();
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  // Keep refs to avoid stale closures in socket callbacks
  const activeRoomIdRef = useRef<string | null>(null);
  const pathnameRef = useRef<string>(pathname);
  const roomsRef = useRef<ChatRoom[]>([]);
  const readRoomIdsRef = useRef<Set<string>>(new Set());
  const lastAcknowledgeTimeRef = useRef<Record<string, number>>({});
  const processedMessageIdsRef = useRef<Map<string, number>>(new Map());

  // Initialize global offline chat retry listeners across entire dashboard
  useEffect(() => {
    setupGlobalOfflineRetryListener();
  }, []);

  // Listen for offline messages successfully sent in background to update rooms sidebar
  useEffect(() => {
    const handleOfflineMessageSent = (event: Event) => {
      const customEvent = event as CustomEvent<OfflineMessageSentDetail>;
      const { serverMessage, roomId, text } = customEvent.detail;

      setRooms((prev) => {
        const roomIndex = prev.findIndex(
          (r) => String(r.id || (r as any)._id) === String(roomId)
        );
        if (roomIndex !== -1) {
          const updated: ChatRoom = {
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

      const isOnChatPage = Boolean(pathnameRef.current?.startsWith("/dashboard/chat"));
      if (!isOnChatPage) {
        toast.success("Queued offline message was sent successfully.");
      }
    };

    window.addEventListener("chat:offline_message_sent", handleOfflineMessageSent);
    return () => {
      window.removeEventListener("chat:offline_message_sent", handleOfflineMessageSent);
    };
  }, []);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
    if (activeRoomId) {
      readRoomIdsRef.current.add(String(activeRoomId));
    }
  }, [activeRoomId]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  // Unlock Web Audio context on first user interaction anywhere on dashboard
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudioContext();
    };
    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  // Request browser Notification permission politely if supported and default
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      const requestNotificationPermission = () => {
        try {
          Notification.requestPermission().catch(() => {});
        } catch {
          // Ignore
        }
      };
      window.addEventListener("click", requestNotificationPermission, {
        once: true,
      });
      return () => {
        window.removeEventListener("click", requestNotificationPermission);
      };
    }
  }, []);

  // Listen to FCM foreground push messages and ensure registration
  useEffect(() => {
    if (!isAuthenticated) return;

    // Ensure FCM token registration on dashboard
    requestFcmToken().catch(() => {});

    let unsubscribe: (() => void) | null = null;
    onForegroundMessage((payload) => {
      console.log("[FCM] Received foreground push notification:", payload);
      playNotificationSound();

      const title =
        payload.notification?.title ||
        payload.data?.title ||
        "Dream Dollars Admin";

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        "You have a new notification.";

      const incomingRoomId = (payload.data?.roomId || payload.data?.room_id) as string | undefined;

      toast.info(title, {
        description: body,
        duration: 7000,
        action: incomingRoomId
          ? {
              label: "Open Chat",
              onClick: () => {
                router.push(`/dashboard/chat?roomId=${incomingRoomId}`);
              },
            }
          : undefined,
      });

      // Show native desktop notification if tab is hidden / background
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          const notif = new Notification(title, {
            body,
            icon: "/images/logo.png",
          });
          notif.onclick = () => {
            window.focus();
            if (incomingRoomId) {
              router.push(`/dashboard/chat?roomId=${incomingRoomId}`);
            }
          };
        } catch {
          // Ignore native notification error
        }
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated, router]);

  // Fetch initial rooms on mount / auth change asynchronously
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    getAdminChatRooms({ page: 1, limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        if (res.rooms) {
          const sanitizedRooms = res.rooms.map((r) => {
            const rId = String(r.id || (r as any)._id || "");
            const isCurrentlyActive =
              Boolean(pathnameRef.current?.startsWith("/dashboard/chat")) &&
              Boolean(activeRoomIdRef.current) &&
              String(activeRoomIdRef.current) === rId;
            const isMarkedRead = readRoomIdsRef.current.has(rId);

            if (isCurrentlyActive || isMarkedRead) {
              return { ...r, admin_unread_count: 0 };
            }
            return r;
          });

          setRooms(sanitizedRooms);
          const sumUnread = sanitizedRooms.reduce(
            (sum, r) => sum + (r.admin_unread_count || 0),
            0
          );
          setTotalUnreadCount(sumUnread);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Fetch rooms on demand
  const refreshRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getAdminChatRooms({ page: 1, limit: 100 });
      if (res.rooms) {
        const sanitizedRooms = res.rooms.map((r) => {
          const rId = String(r.id || (r as any)._id || "");
          const isCurrentlyActive =
            Boolean(pathnameRef.current?.startsWith("/dashboard/chat")) &&
            Boolean(activeRoomIdRef.current) &&
            String(activeRoomIdRef.current) === rId;
          const isMarkedRead = readRoomIdsRef.current.has(rId);

          if (isCurrentlyActive || isMarkedRead) {
            return { ...r, admin_unread_count: 0 };
          }
          return r;
        });

        setRooms(sanitizedRooms);
        const sumUnread = sanitizedRooms.reduce(
          (sum, r) => sum + (r.admin_unread_count || 0),
          0
        );
        setTotalUnreadCount(sumUnread);
      }
    } catch {
      // Ignore failure gracefully
    }
  }, [isAuthenticated]);

  // Mark room as read: resets that room's unread count immediately and adjusts total unread count
  const markRoomAsRead = useCallback((roomId: string) => {
    if (!roomId) return;
    const normalizedRoomId = String(roomId);
    readRoomIdsRef.current.add(normalizedRoomId);

    // Emit socket read events if connected
    const sock = getChatSocket();
    if (sock && sock.connected) {
      sock.emit("mark_read", { roomId: normalizedRoomId, room_id: normalizedRoomId });
      sock.emit("mark_as_read", { roomId: normalizedRoomId, room_id: normalizedRoomId });
    }

    setRooms((prev) => {
      let unreadDelta = 0;
      const updated = prev.map((r) => {
        const rId = String(r.id || (r as any)._id || "");
        if (rId === normalizedRoomId) {
          unreadDelta = r.admin_unread_count || 0;
          return { ...r, admin_unread_count: 0 };
        }
        return r;
      });
      if (unreadDelta > 0) {
        setTotalUnreadCount((current) => Math.max(0, current - unreadDelta));
      }
      return updated;
    });
  }, []);

  // Initialize and manage global Chat Socket
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const sock = getChatSocket();
    if (!sock) return;

    // Schedule socket state update asynchronously to avoid effect body warning
    queueMicrotask(() => {
      setSocket(sock);
      if (sock.connected) {
        setIsSocketConnected(true);
      }
    });

    const handleConnect = () => {
      setIsSocketConnected(true);
      if (activeRoomIdRef.current) {
        sock.emit("join_room", { roomId: activeRoomIdRef.current });
      }
      // Re-trigger pending queue on socket connect/reconnect
      processPendingQueue().catch(() => {});
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    // Global Inbound new_message handler
    const handleNewMessage = (newMsg: ChatMessage) => {
      // If incoming message has a tempId, remove from offline queue to avoid duplicate sends
      if (newMsg.tempId) {
        removePendingMessage(newMsg.tempId);
      }

      // Only process notifications for messages sent by users/customers
      if (newMsg.sender_type !== "user") {
        return;
      }

      // Deduplicate incoming messages (prevents double notifications from duplicate socket emissions)
      const rawId = newMsg.id || (newMsg as any)._id || (newMsg as any).messageId || (newMsg as any).message_id;
      const incomingRoomId = String(newMsg.room_id || (newMsg as any).roomId || "");
      const messageKey = rawId
        ? String(rawId)
        : `${incomingRoomId}_${newMsg.sender_id || (newMsg as any).senderId || ""}_${newMsg.created_at || (newMsg as any).createdAt || ""}_${newMsg.text || ""}`;

      const now = Date.now();
      // Clean up entries older than 60 seconds
      for (const [key, timestamp] of processedMessageIdsRef.current.entries()) {
        if (now - timestamp > 60000) {
          processedMessageIdsRef.current.delete(key);
        }
      }

      if (processedMessageIdsRef.current.has(messageKey)) {
        console.log("[ChatNotification] Ignored duplicate new_message event:", messageKey);
        return;
      }
      processedMessageIdsRef.current.set(messageKey, now);

      const currentActiveRoomId = String(activeRoomIdRef.current || "");
      const isOnChatPage = Boolean(pathnameRef.current?.startsWith("/dashboard/chat"));
      const isTabVisible = typeof document !== "undefined" && document.visibilityState === "visible";

      const isViewingActiveRoom =
        isOnChatPage &&
        Boolean(currentActiveRoomId) &&
        Boolean(incomingRoomId) &&
        currentActiveRoomId === incomingRoomId &&
        isTabVisible;

      // If admin is NOT actively viewing this specific chat room:
      // Play sound chime & show interactive toast notification
      if (!isViewingActiveRoom) {
        // 1. Play melodic notification chime
        playNotificationSound();

        // 2. Resolve sender name
        const roomMatch = roomsRef.current.find(
          (r) => String(r.id || (r as any)._id || "") === incomingRoomId
        );
        const fallbackMsg = newMsg as unknown as {
          sender_name?: string;
          user_name?: string;
        };
        const senderName =
          roomMatch?.user_name ||
          fallbackMsg.sender_name ||
          fallbackMsg.user_name ||
          "Customer";

        const messagePreview =
          newMsg.text ||
          (newMsg.attachments?.length
            ? "Sent an attachment"
            : "New message received");

        // 3. Display rich Sonner toast (deduplicated by messageKey ID)
        toast.info(`New message from ${senderName}`, {
          id: `msg-toast-${messageKey}`,
          description: messagePreview,
          duration: 7000,
          action: {
            label: "Open Chat",
            onClick: () => {
              router.push(`/dashboard/chat?roomId=${incomingRoomId}`);
            },
          },
        });

        // 4. Trigger desktop web notification if tab is in background
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          !isTabVisible
        ) {
          try {
            const notif = new Notification(`New message from ${senderName}`, {
              body: messagePreview,
              icon: "/favicon.ico",
            });
            notif.onclick = () => {
              window.focus();
              router.push(`/dashboard/chat?roomId=${incomingRoomId}`);
            };
          } catch {
            // Ignore native notification errors
          }
        }
      } else {
        // Admin is actively viewing this room: acknowledge read to backend database so it persists on refresh
        const now = Date.now();
        if (now - (lastAcknowledgeTimeRef.current[incomingRoomId] || 0) > 1500) {
          lastAcknowledgeTimeRef.current[incomingRoomId] = now;
          getChatMessages(incomingRoomId, { page: 1, limit: 1 }).catch(() => {});
          if (sock.connected) {
            sock.emit("mark_read", { roomId: incomingRoomId, room_id: incomingRoomId });
            sock.emit("mark_as_read", { roomId: incomingRoomId, room_id: incomingRoomId });
          }
        }
      }

      // Update room preview & unread count
      setRooms((prev) => {
        const roomIdx = prev.findIndex(
          (r) => String(r.id || (r as any)._id || "") === incomingRoomId
        );
        const lastText =
          newMsg.text ||
          (newMsg.attachments?.length ? "Attachment" : "New message");

        if (roomIdx !== -1) {
          const target = prev[roomIdx];
          const newUnread = isViewingActiveRoom
            ? 0
            : (target.admin_unread_count || 0) + 1;

          const updatedRoom: ChatRoom = {
            ...target,
            last_message_text: lastText,
            last_message_sender_type: "user",
            last_message_sent_at: newMsg.created_at,
            admin_unread_count: newUnread,
          };

          const rest = prev.filter((_, idx) => idx !== roomIdx);
          return [updatedRoom, ...rest];
        } else {
          // Room not in current list (e.g. brand new user chat), fetch fresh list
          refreshRooms();
          return prev;
        }
      });

      // Increment total unread count only if not currently viewing this room
      if (!isViewingActiveRoom) {
        setTotalUnreadCount((prev) => prev + 1);
      }
    };

    sock.on("connect", handleConnect);
    sock.on("disconnect", handleDisconnect);
    sock.on("new_message", handleNewMessage);

    return () => {
      sock.off("connect", handleConnect);
      sock.off("disconnect", handleDisconnect);
      sock.off("new_message", handleNewMessage);
    };
  }, [isAuthenticated, refreshRooms, router]);

  return (
    <ChatNotificationContext.Provider
      value={{
        socket,
        isSocketConnected,
        activeRoomId,
        setActiveRoomId,
        totalUnreadCount,
        setTotalUnreadCount,
        rooms,
        refreshRooms,
        markRoomAsRead,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error(
      "useChatNotifications must be used within a ChatNotificationProvider"
    );
  }
  return context;
}
