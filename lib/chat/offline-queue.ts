import { sendChatMessage, ChatMessage } from "@/lib/api/chat.api";

export interface PendingChatMessage {
  tempId: string;
  roomId: string;
  text: string;
  createdAt: string; // ISO string for timestamp ordering
  retryCount?: number;
  lastAttemptAt?: number;
  error?: string;
}

export interface OfflineMessageSentDetail {
  tempId: string;
  serverMessage: ChatMessage;
  roomId: string;
  text: string;
}

export interface OfflineMessageFailedDetail {
  tempId: string;
  roomId: string;
  error: string;
  fatal?: boolean;
}

const STORAGE_KEY = "chat_pending_messages";

// Lock set to track messages currently being transmitted over HTTP to avoid duplicate sends
const inFlightTempIds = new Set<string>();
let isQueueProcessing = false;
let isListenerInitialized = false;

function emitQueueEvent(name: string, detail: any) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch (e) {
    console.error(`[OfflineQueue] Error dispatching event ${name}:`, e);
  }
}

/**
 * Retrieve all pending messages from persistent storage, sorted chronologically ascending (FIFO).
 */
export const getPendingMessages = (roomId?: string): PendingChatMessage[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const all: PendingChatMessage[] = JSON.parse(raw);
    if (!Array.isArray(all)) return [];

    // Sort ascending by createdAt (oldest first) to ensure strict message ordering
    const sorted = all.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return roomId ? sorted.filter((m) => m.roomId === roomId) : sorted;
  } catch (err) {
    console.error("[OfflineQueue] Failed to parse pending messages from localStorage:", err);
    return [];
  }
};

/**
 * Persist or update a pending message in local storage.
 */
export const savePendingMessage = (msg: PendingChatMessage): void => {
  if (typeof window === "undefined" || !msg.tempId) return;
  try {
    const all = getPendingMessages();
    const existingIndex = all.findIndex((m) => m.tempId === msg.tempId);
    let updated: PendingChatMessage[];

    if (existingIndex !== -1) {
      updated = [...all];
      updated[existingIndex] = {
        ...msg,
        // Preserve original creation timestamp so queue order is never corrupted
        createdAt: all[existingIndex].createdAt || msg.createdAt,
      };
    } else {
      updated = [...all, msg];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitQueueEvent("chat:offline_queue_updated", { queue: updated });
  } catch (err) {
    console.error("[OfflineQueue] Failed to save pending message:", err);
  }
};

/**
 * Remove a pending message from local storage (e.g. after successful transmission or server confirmation).
 */
export const removePendingMessage = (tempId: string): void => {
  if (typeof window === "undefined" || !tempId) return;
  try {
    const all = getPendingMessages();
    const filtered = all.filter((m) => m.tempId !== tempId);
    if (filtered.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    emitQueueEvent("chat:offline_queue_updated", { queue: filtered });
  } catch (err) {
    console.error("[OfflineQueue] Failed to remove pending message:", err);
  }
};

/**
 * Check if a tempId is currently pending or in-flight.
 */
export const isPendingMessage = (tempId: string): boolean => {
  if (inFlightTempIds.has(tempId)) return true;
  return getPendingMessages().some((m) => m.tempId === tempId);
};

/**
 * Process all pending offline messages across all rooms sequentially.
 * Guarantees:
 * 1. Sequential FIFO order per conversation room (oldest message first).
 * 2. Deduplication using an in-flight lock set.
 * 3. Graceful handling of network drops (stops subsequent room messages so order is not inverted).
 */
export const processPendingQueue = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) {
    return;
  }
  if (isQueueProcessing) {
    return;
  }

  isQueueProcessing = true;

  try {
    const allPending = getPendingMessages();
    if (allPending.length === 0) return;

    console.log(`[OfflineQueue] Retrying ${allPending.length} pending message(s)...`);

    // Group pending messages by roomId to send messages sequentially per room
    const messagesByRoom = new Map<string, PendingChatMessage[]>();
    for (const msg of allPending) {
      const list = messagesByRoom.get(msg.roomId) || [];
      list.push(msg);
      messagesByRoom.set(msg.roomId, list);
    }

    for (const [roomId, roomMessages] of messagesByRoom.entries()) {
      // Sort strictly ascending by createdAt (oldest first)
      roomMessages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const msg of roomMessages) {
        // If internet connection dropped mid-batch, halt immediately
        if (!navigator.onLine) {
          console.log("[OfflineQueue] Network disconnected mid-queue. Halting.");
          return;
        }

        // Prevent duplicate transmission if already in flight
        if (inFlightTempIds.has(msg.tempId)) {
          continue;
        }

        inFlightTempIds.add(msg.tempId);

        try {
          emitQueueEvent("chat:offline_message_retrying", {
            tempId: msg.tempId,
            roomId: msg.roomId,
          });

          const serverMessage = await sendChatMessage(msg.roomId, {
            text: msg.text,
            tempId: msg.tempId,
          });

          if (serverMessage && (serverMessage.id || serverMessage.tempId)) {
            // Remove from queue
            removePendingMessage(msg.tempId);

            // Notify subscribers
            emitQueueEvent("chat:offline_message_sent", {
              tempId: msg.tempId,
              serverMessage,
              roomId: msg.roomId,
              text: msg.text,
            } as OfflineMessageSentDetail);
          } else {
            throw new Error("Invalid response received from chat server");
          }
        } catch (error: any) {
          console.warn(`[OfflineQueue] Retry failed for message ${msg.tempId}:`, error);

          const status = error?.response?.status;
          // Fatal 4xx error (e.g. 400 Bad Request, 404 Room not found)
          const isFatal =
            typeof status === "number" &&
            status >= 400 &&
            status < 500 &&
            status !== 408 &&
            status !== 429;

          if (isFatal) {
            removePendingMessage(msg.tempId);
            emitQueueEvent("chat:offline_message_failed", {
              tempId: msg.tempId,
              roomId: msg.roomId,
              error:
                error?.response?.data?.message ||
                error?.message ||
                "Message could not be delivered",
              fatal: true,
            } as OfflineMessageFailedDetail);
          } else {
            // Transient network error or 5xx: Update retry metadata and keep in storage
            const current = getPendingMessages().find((m) => m.tempId === msg.tempId);
            if (current) {
              savePendingMessage({
                ...current,
                retryCount: (current.retryCount || 0) + 1,
                lastAttemptAt: Date.now(),
                error: error?.message,
              });
            }

            emitQueueEvent("chat:offline_message_failed", {
              tempId: msg.tempId,
              roomId: msg.roomId,
              error: error?.message || "Network error",
              fatal: false,
            } as OfflineMessageFailedDetail);

            // PRESERVE ORDER: If an earlier message in this room fails to send due to network,
            // stop processing subsequent messages in this room to prevent out-of-order delivery!
            break;
          }
        } finally {
          inFlightTempIds.delete(msg.tempId);
        }
      }
    }
  } finally {
    isQueueProcessing = false;
  }
};

/**
 * Manually retry sending a single pending message (e.g. from user retry button click in chat bubble).
 */
export const retrySinglePendingMessage = async (
  tempId: string
): Promise<ChatMessage | null> => {
  if (typeof window === "undefined" || !tempId) return null;
  if (!navigator.onLine) {
    throw new Error("Cannot send message: You are currently offline.");
  }

  if (inFlightTempIds.has(tempId)) {
    return null;
  }

  const all = getPendingMessages();
  const msg = all.find((m) => m.tempId === tempId);
  if (!msg) {
    console.warn(`[OfflineQueue] Message ${tempId} not found in pending storage.`);
    return null;
  }

  inFlightTempIds.add(tempId);
  emitQueueEvent("chat:offline_message_retrying", { tempId, roomId: msg.roomId });

  try {
    const serverMessage = await sendChatMessage(msg.roomId, {
      text: msg.text,
      tempId: msg.tempId,
    });

    if (serverMessage && (serverMessage.id || serverMessage.tempId)) {
      removePendingMessage(tempId);
      emitQueueEvent("chat:offline_message_sent", {
        tempId,
        serverMessage,
        roomId: msg.roomId,
        text: msg.text,
      } as OfflineMessageSentDetail);
      return serverMessage;
    }
    throw new Error("Invalid response received from chat server");
  } catch (err: any) {
    console.warn(`[OfflineQueue] Single retry failed for message ${tempId}:`, err);
    emitQueueEvent("chat:offline_message_failed", {
      tempId,
      roomId: msg.roomId,
      error: err?.response?.data?.message || err?.message || "Failed to send message",
      fatal: false,
    } as OfflineMessageFailedDetail);
    throw err;
  } finally {
    inFlightTempIds.delete(tempId);
  }
};

/**
 * Global online event listener setup.
 * Mounts once on the client and continuously listens for online/visibility events
 * across all pages of the application.
 */
export const setupGlobalOfflineRetryListener = (): void => {
  if (typeof window === "undefined" || isListenerInitialized) return;
  isListenerInitialized = true;

  const handleOnline = () => {
    console.log("[OfflineQueue] Global 'online' event detected! Retrying all pending chat messages...");
    processPendingQueue().catch((err) => {
      console.error("[OfflineQueue] Error during auto-retry on online:", err);
    });
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      processPendingQueue().catch(() => {});
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Check immediately upon initialization if there are any queued messages from a previous session
  if (navigator.onLine) {
    setTimeout(() => {
      processPendingQueue().catch(() => {});
    }, 1200);
  }
};
